/**
 * Real plant-disease image classification with ONNX Runtime.
 *
 * Model: MobileNetV2 (224x224, 38 PlantVillage classes), ONNX export of
 * linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification.
 *
 * This module performs actual model inference. If the model or the native
 * runtime is missing it fails loudly (503) instead of returning a fake
 * prediction. Agronomic guidance is kept in a separate object and is not
 * produced by the model.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const MODEL_DIR = process.env.DISEASE_MODEL_DIR
  ? path.resolve(process.env.DISEASE_MODEL_DIR)
  : path.join(__dirname, '..', 'models', 'plant_disease');

const MODEL_FILE = process.env.DISEASE_MODEL_FILE || 'model.onnx';
const MODEL_PATH = path.join(MODEL_DIR, MODEL_FILE);
const CONFIG_PATH = path.join(MODEL_DIR, 'config.json');
const PREPROCESSOR_PATH = path.join(MODEL_DIR, 'preprocessor_config.json');

const EXECUTION_PROVIDER = (process.env.ORT_EXECUTION_PROVIDER || 'cpu').toLowerCase();
const INPUT_SIZE = 224;
const RESIZE_SHORT_EDGE = 256;

let sessionPromise = null;
let modelMetaCache = null;
let ortModule = null;
let sharpModule = null;

function loadRuntime() {
  if (!ortModule) ortModule = require('onnxruntime-node');
  if (!sharpModule) sharpModule = require('sharp');
  return { ort: ortModule, sharp: sharpModule };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function modelAvailable() {
  return fs.existsSync(MODEL_PATH) && fs.existsSync(CONFIG_PATH);
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

function getModelInfo() {
  const available = modelAvailable();
  if (!modelMetaCache) {
    let labels = {};
    if (available) labels = readJson(CONFIG_PATH).id2label || {};
    modelMetaCache = {
      available,
      name: 'plant-disease-mobilenetv2',
      architecture: 'MobileNetV2 (float32)',
      task: 'Image classification',
      dataset: 'PlantVillage / New Plant Diseases Dataset (38 classes)',
      source: 'https://huggingface.co/onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX',
      base_model: 'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification',
      license: 'Model card declares license: other. Verify terms with the model authors before commercial redistribution.',
      reported_accuracy: '95.41% on the model author\'s evaluation split (not re-measured by KrishiDrive)',
      classes: Object.keys(labels).length,
      class_labels: Object.values(labels),
      input: { shape: [1, 3, INPUT_SIZE, INPUT_SIZE], dtype: 'float32', color: 'RGB' },
      preprocessing: {
        resize_short_edge: RESIZE_SHORT_EDGE,
        center_crop: INPUT_SIZE,
        mean: [0.5, 0.5, 0.5],
        std: [0.5, 0.5, 0.5]
      },
      execution_provider: EXECUTION_PROVIDER,
      file: MODEL_FILE,
      bytes: available ? fs.statSync(MODEL_PATH).size : 0,
      sha256: available ? sha256(MODEL_PATH) : null,
      error: available ? null : `Model file not found at ${MODEL_PATH}`
    };
  }
  return modelMetaCache;
}

function getRuntimeInfo() {
  let providers = [];
  let runtimeVersion = null;
  try {
    const { ort } = loadRuntime();
    runtimeVersion = require('onnxruntime-node/package.json').version;
    if (typeof ort.listSupportedBackends === 'function') {
      providers = ort.listSupportedBackends().map(b => b.name);
    }
  } catch (err) {
    return {
      runtime: 'onnxruntime-node',
      installed: false,
      error: err.message,
      execution_provider: EXECUTION_PROVIDER,
      providers: []
    };
  }
  return {
    runtime: 'onnxruntime-node',
    runtime_version: runtimeVersion,
    installed: true,
    execution_provider: EXECUTION_PROVIDER,
    providers,
    npu_verified: false,
    npu_note: 'No NPU/QNN execution provider was verified on this host. Inference runs on CPU unless ORT_EXECUTION_PROVIDER is explicitly changed and validated.',
    platform: process.platform,
    arch: process.arch,
    cpu: (os.cpus()[0] || {}).model || 'unknown',
    logical_cores: os.cpus().length,
    total_memory_gb: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10
  };
}

async function getSession() {
  if (!modelAvailable()) {
    const err = new Error('Disease model is not installed on this server.');
    err.code = 'MODEL_UNAVAILABLE';
    err.status = 503;
    throw err;
  }
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { ort } = loadRuntime();
      const session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: [EXECUTION_PROVIDER],
        graphOptimizationLevel: 'all'
      });
      return session;
    })().catch(err => {
      sessionPromise = null;
      err.status = 503;
      throw err;
    });
  }
  return sessionPromise;
}

/**
 * Validate an image by decoding it. Returns metadata or throws a 400 error.
 */
async function inspectImage(filePath) {
  const { sharp } = loadRuntime();
  const stat = fs.statSync(filePath);
  if (stat.size > 8 * 1024 * 1024) {
    throw Object.assign(new Error('Image exceeds the 8 MB limit'), { status: 413 });
  }
  let meta;
  try {
    meta = await sharp(filePath).metadata();
  } catch {
    throw Object.assign(new Error('Uploaded file is not a decodable image'), { status: 400 });
  }
  if (!['jpeg', 'png', 'webp'].includes(meta.format)) {
    throw Object.assign(new Error(`Unsupported image format: ${meta.format}. Use JPEG, PNG, or WebP.`), { status: 400 });
  }
  if (!meta.width || !meta.height || meta.width < 32 || meta.height < 32) {
    throw Object.assign(new Error('Image is too small for inference (minimum 32x32)'), { status: 400 });
  }
  return meta;
}

async function preprocess(filePath) {
  const { sharp } = loadRuntime();
  // Resize shortest edge to 256, then center-crop 224x224, mirroring the
  // MobileNetV2 feature extractor used during training.
  const resized = await sharp(filePath)
    .rotate()
    .resize(RESIZE_SHORT_EDGE, RESIZE_SHORT_EDGE, { fit: 'inside', withoutEnlargement: false })
    .removeAlpha()
    .toFormat('png')
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.max(0, Math.floor((meta.width - INPUT_SIZE) / 2));
  const top = Math.max(0, Math.floor((meta.height - INPUT_SIZE) / 2));
  const { data, info } = await sharp(resized)
    .extract({ left, top, width: INPUT_SIZE, height: INPUT_SIZE })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 3) {
    throw Object.assign(new Error('Image has no colour channels'), { status: 400 });
  }

  const pixelCount = INPUT_SIZE * INPUT_SIZE;
  const input = new Float32Array(3 * pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * info.channels] / 255;
    const g = data[i * info.channels + 1] / 255;
    const b = data[i * info.channels + 2] / 255;
    input[i] = (r - 0.5) / 0.5;
    input[pixelCount + i] = (g - 0.5) / 0.5;
    input[2 * pixelCount + i] = (b - 0.5) / 0.5;
  }
  return input;
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

function describeLabel(label) {
  if (!label) return { crop: 'Unknown', condition: 'Unknown', is_healthy: false };
  if (label.startsWith('Healthy ')) {
    return { crop: label.replace(/^Healthy /, '').replace(/ Plant$/, '').trim(), condition: 'Healthy', is_healthy: true };
  }
  const parts = label.split(' with ');
  if (parts.length === 2) {
    return { crop: parts[0].trim(), condition: parts[1].trim(), is_healthy: false };
  }
  if (label === 'Cedar Apple Rust') return { crop: 'Apple', condition: label, is_healthy: false };
  if (label === 'Apple Scab') return { crop: 'Apple', condition: label, is_healthy: false };
  if (label.startsWith('Tomato ')) return { crop: 'Tomato', condition: label.replace(/^Tomato /, ''), is_healthy: false };
  return { crop: 'Unknown', condition: label, is_healthy: false };
}

const GUIDANCE = {
  'Early Blight': {
    pathogen: 'Alternaria solani (fungus)',
    symptoms: 'Concentric dark brown "target-board" spots on older leaves, often with yellow halos.',
    chemical: 'Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1 ml/L, repeat every 10-14 days.',
    organic: 'Pseudomonas fluorescens @ 10 g/L or neem seed kernel extract 5%.',
    urgency: 'Treat within 48-72 hours and remove heavily infected leaves.'
  },
  'Late Blight': {
    pathogen: 'Phytophthora infestans (oomycete)',
    symptoms: 'Dark water-soaked greasy patches with white mildew on leaf undersides; spreads rapidly in cool, wet weather.',
    chemical: 'Metalaxyl-M + Mancozeb @ 2 g/L immediately; alternate actives to limit resistance.',
    organic: 'Remove and destroy infected foliage; copper oxychloride 50% WP @ 3 g/L.',
    urgency: 'Critical - act within 24 hours.'
  },
  'Bacterial Spot': {
    pathogen: 'Xanthomonas species (bacterium)',
    symptoms: 'Small water-soaked circular spots with dry centres and yellow margins.',
    chemical: 'Streptocycline 1 g/10 L + copper oxychloride 25 g/10 L.',
    organic: 'Bordeaux mixture 1%; avoid overhead irrigation.',
    urgency: 'Moderate - treat at first symptoms.'
  },
  'Powdery Mildew': {
    pathogen: 'Erysiphe / Podosphaera species (fungus)',
    symptoms: 'White talcum-like patches on upper leaf surfaces and young shoots.',
    chemical: 'Wettable sulphur 80% WP @ 2.5 g/L or hexaconazole 5% SC @ 1 ml/L.',
    organic: 'Baking soda 5 g/L with a few drops of horticultural oil; improve airflow.',
    urgency: 'Low to moderate.'
  },
  'Leaf Mold': {
    pathogen: 'Passalora fulva (fungus)',
    symptoms: 'Pale yellow patches on upper leaves with olive-green fuzzy growth underneath.',
    chemical: 'Chlorothalonil 75% WP @ 2 g/L or difenoconazole 25% EC @ 0.5 ml/L.',
    organic: 'Increase ventilation, remove lower infected leaves, avoid leaf wetness.',
    urgency: 'Moderate.'
  },
  'Septoria Leaf Spot': {
    pathogen: 'Septoria lycopersici (fungus)',
    symptoms: 'Many small circular spots with grey centres and dark borders on lower leaves.',
    chemical: 'Copper hydroxide @ 2 g/L or chlorothalonil 75% WP @ 2 g/L.',
    organic: 'Mulch to stop soil splash; remove infected leaves; copper-based spray.',
    urgency: 'Moderate.'
  },
  'Spider Mites or Two-spotted Spider Mite': {
    pathogen: 'Tetranychus urticae (mite)',
    symptoms: 'Fine stippling, bronzing, and webbing on leaf undersides in hot, dry conditions.',
    chemical: 'Abamectin 1.9% EC @ 0.5 ml/L or spiromesifen 22.9% SC @ 1 ml/L; rotate modes of action.',
    organic: 'Strong water jet to undersides, neem oil 3 ml/L, encourage predatory mites.',
    urgency: 'Moderate to high in dry weather.'
  },
  'Target Spot': {
    pathogen: 'Corynespora cassiicola (fungus)',
    symptoms: 'Brown lesions with concentric rings and a yellow halo.',
    chemical: 'Azoxystrobin 23% SC @ 1 ml/L or difenoconazole 25% EC @ 0.5 ml/L.',
    organic: 'Improve airflow, remove debris, apply Trichoderma-based biofungicide.',
    urgency: 'Moderate.'
  },
  'Yellow Leaf Curl Virus': {
    pathogen: 'Tomato yellow leaf curl virus (TYLCV), vectored by whitefly',
    symptoms: 'Upward-curling, yellowing leaves, stunted growth, reduced fruit set.',
    chemical: 'No direct cure; manage whitefly with imidacloprid 17.8% SL @ 0.3 ml/L or diafenthiuron 50% WP @ 1 g/L.',
    organic: 'Yellow sticky traps, neem oil, reflective mulch, remove infected plants.',
    urgency: 'High - vector control is essential.'
  },
  'Mosaic Virus': {
    pathogen: 'Tomato mosaic virus (ToMV)',
    symptoms: 'Mottled light/dark green leaves, distortion, and stunting.',
    chemical: 'No chemical cure; control aphids and sanitise tools.',
    organic: 'Remove infected plants, disinfect tools, use resistant varieties.',
    urgency: 'High - prevent spread.'
  },
  'Black Rot': {
    pathogen: 'Guignardia bidwellii / Xanthomonas campestris (varies by crop)',
    symptoms: 'Dark sunken lesions on leaves and fruit; fruit may shrivel into black mummies.',
    chemical: 'Consult local extension guidance; captan or copper-based protectants are common.',
    organic: 'Remove mummified fruit and infected canes; improve canopy airflow.',
    urgency: 'Moderate to high.'
  },
  'Cedar Apple Rust': {
    pathogen: 'Gymnosporangium juniperi-virginianae (fungus)',
    symptoms: 'Bright orange-yellow spots on apple leaves; galls on nearby juniper hosts.',
    chemical: 'Myclobutanil 10% WP @ 0.4 g/L at early leaf emergence.',
    organic: 'Remove nearby juniper galls where practical; plant resistant apple varieties.',
    urgency: 'Seasonal - protect new growth.'
  },
  'Cercospora and Gray Leaf Spot': {
    pathogen: 'Cercospora zeae-maydis (fungus)',
    symptoms: 'Long rectangular grey-brown lesions running between leaf veins.',
    chemical: 'Azoxystrobin 23% SC @ 1 ml/L or propiconazole 25% EC @ 1 ml/L.',
    organic: 'Crop rotation, residue management, resistant hybrids.',
    urgency: 'Moderate.'
  },
  'Common Rust': {
    pathogen: 'Puccinia sorghi (fungus)',
    symptoms: 'Small reddish-brown pustules scattered on both leaf surfaces.',
    chemical: 'Propiconazole 25% EC @ 1 ml/L if severe before tasselling.',
    organic: 'Resistant hybrids and early sowing; usually not economic to spray.',
    urgency: 'Low to moderate.'
  },
  'Northern Leaf Blight': {
    pathogen: 'Exserohilum turcicum (fungus)',
    symptoms: 'Long cigar-shaped grey-green lesions on leaves.',
    chemical: 'Azoxystrobin or propiconazole at first lesions.',
    organic: 'Residue management, rotation, resistant hybrids.',
    urgency: 'Moderate.'
  },
  'Citrus Greening': {
    pathogen: 'Candidatus Liberibacter asiaticus (bacterium), vectored by citrus psyllid',
    symptoms: 'Blotchy mottled leaves, lopsided fruit, yellow shoots.',
    chemical: 'No cure; manage psyllid vectors and remove infected trees.',
    organic: 'Certified disease-free planting stock, psyllid monitoring, remove infected trees.',
    urgency: 'Critical - report to local horticulture authority.'
  },
  'Leaf Scorch': {
    pathogen: 'Diplocarpon earlianum (fungus)',
    symptoms: 'Purple to brown irregular spots that coalesce, giving a scorched appearance.',
    chemical: 'Captan 50% WP @ 2 g/L or copper-based fungicide.',
    organic: 'Remove old leaves, avoid overhead irrigation, improve spacing.',
    urgency: 'Moderate.'
  },
  'Esca (Black Measles)': {
    pathogen: 'Complex of wood-decay fungi',
    symptoms: 'Interveinal yellowing and tiger-stripe patterns; dark streaks in wood.',
    chemical: 'No effective curative spray; prune out affected wood.',
    organic: 'Sanitise pruning tools, protect pruning wounds, remove severely affected vines.',
    urgency: 'Chronic - manage vineyard sanitation.'
  },
  'Isariopsis Leaf Spot': {
    pathogen: 'Pseudocercospora vitis (fungus)',
    symptoms: 'Dark brown angular spots with yellow margins on older grape leaves.',
    chemical: 'Copper oxychloride 50% WP @ 3 g/L or mancozeb 75% WP @ 2.5 g/L.',
    organic: 'Canopy management and copper-based protectants.',
    urgency: 'Low to moderate.'
  }
};

function guidanceFor(condition) {
  if (condition === 'Healthy') {
    return {
      pathogen: null,
      symptoms: 'No disease class detected by the model.',
      chemical: 'No chemical treatment indicated.',
      organic: 'Continue balanced nutrition, scouting, and good airflow.',
      urgency: 'None. Re-check if symptoms develop.',
      note: 'A healthy prediction is not a guarantee; the model can miss early or unusual symptoms.'
    };
  }
  const match = GUIDANCE[condition];
  if (match) return { ...match, note: 'General extension guidance, not a prescription for this field.' };
  return {
    pathogen: 'Not specified in the built-in guidance table.',
    symptoms: 'Refer to the predicted class label and inspect the plant closely.',
    chemical: 'Confirm the diagnosis with a local Krishi Vigyan Kendra before spraying.',
    organic: 'Remove affected material and improve airflow while awaiting confirmation.',
    urgency: 'Confirm diagnosis before treatment.',
    note: 'No crop-specific guidance is bundled for this class.'
  };
}

/**
 * Run inference on an image file.
 * @returns {Promise<object>} prediction + model metadata + latency
 */
async function classify(filePath, { topK = 5 } = {}) {
  await inspectImage(filePath);
  const { ort } = loadRuntime();

  const session = await getSession();
  const input = await preprocess(filePath);
  const tensor = new ort.Tensor('float32', input, [1, 3, INPUT_SIZE, INPUT_SIZE]);
  const feeds = { [session.inputNames[0]]: tensor };

  const started = process.hrtime.bigint();
  const output = await session.run(feeds);
  const latencyMs = Number(process.hrtime.bigint() - started) / 1e6;

  const logits = Array.from(output[session.outputNames[0]].data);
  const probabilities = softmax(logits);
  const ranked = probabilities
    .map((p, index) => ({ p, index }))
    .sort((a, b) => b.p - a.p)
    .slice(0, Math.max(1, Math.min(10, topK)));

  const modelInfo = getModelInfo();
  const labels = modelInfo.class_labels;
  const topPredictions = ranked.map(({ p, index }) => {
    const label = labels[index];
    const described = describeLabel(label);
    return {
      class_index: index,
      label,
      crop: described.crop,
      condition: described.condition,
      is_healthy: described.is_healthy,
      confidence: Math.round(p * 10000) / 10000,
      confidence_percent: Math.round(p * 1000) / 10
    };
  });

  const best = topPredictions[0];
  return {
    prediction: { ...best, confidence_percent: Math.round(best.confidence * 1000) / 10 },
    top_predictions: topPredictions,
    agronomic_guidance: guidanceFor(best.condition),
    latency_ms: Math.round(latencyMs * 100) / 100,
    model: {
      ...modelInfo,
      runtime: 'onnxruntime-node',
      execution_provider_actual: EXECUTION_PROVIDER
    },
    disclaimer: 'Model prediction only. Confirm with a qualified agronomist or Krishi Vigyan Kendra before applying any chemical treatment.'
  };
}

module.exports = {
  classify,
  getModelInfo,
  getRuntimeInfo,
  modelAvailable,
  inspectImage,
  MODEL_PATH,
  MODEL_DIR
};
