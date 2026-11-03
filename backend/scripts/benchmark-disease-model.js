/**
 * Measured ONNX inference benchmark (no synthetic numbers).
 *
 * Usage:
 *   node scripts/benchmark-disease-model.js
 *   node scripts/benchmark-disease-model.js --runs 100 --warmup 10
 *   node scripts/benchmark-disease-model.js --out models/plant_disease/benchmark.json
 *
 * The benchmark runs the real classifier on real PlantVillage leaf images.
 * It reports session.run latency and end-to-end latency (preprocessing +
 * inference). Run it on the hardware you intend to deploy on.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { classify, getModelInfo, getRuntimeInfo } = require('../ai/diseaseClassifier');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const WARMUP = parseInt(arg('warmup', '10'), 10);
const RUNS = parseInt(arg('runs', '100'), 10);
const OUT = path.resolve(arg('out', path.join(__dirname, '..', 'models', 'plant_disease', 'benchmark.json')));

const DEFAULT_IMAGES = [
  path.join(__dirname, '..', 'test', 'fixtures', 'leaf_tomato_early_blight.jpg'),
  path.join(__dirname, '..', 'test', 'fixtures', 'leaf_tomato_healthy.jpg')
].filter(p => fs.existsSync(p));

const images = (arg('images', '') ? arg('images').split(',') : DEFAULT_IMAGES).filter(p => fs.existsSync(p));

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function stats(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
    avg: Math.round((sum / sorted.length) * 100) / 100,
    p50: Math.round(percentile(sorted, 50) * 100) / 100,
    p95: Math.round(percentile(sorted, 95) * 100) / 100,
    p99: Math.round(percentile(sorted, 99) * 100) / 100
  };
}

(async () => {
  if (!images.length) {
    console.error('No benchmark images found. Pass --images a.jpg,b.jpg');
    process.exit(1);
  }
  const model = getModelInfo();
  if (!model.available) {
    console.error(model.error);
    process.exit(1);
  }
  if (RUNS < 1) {
    console.error('--runs must be >= 1');
    process.exit(1);
  }

  console.log(`Model: ${model.name} (${(model.bytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Runtime: ${getRuntimeInfo().runtime} ${getRuntimeInfo().runtime_version || ''}`);
  console.log(`Execution provider: ${model.execution_provider}`);
  console.log(`Images: ${images.length}, warm-up: ${WARMUP}, measured runs: ${RUNS}\n`);

  // Warm-up: loads the ONNX session and lets the CPU caches settle.
  let lastPrediction = null;
  for (let i = 0; i < WARMUP; i++) {
    lastPrediction = await classify(images[i % images.length]);
    process.stdout.write(`\rWarm-up ${i + 1}/${WARMUP}`);
  }
  process.stdout.write('\n');

  const inference = [];
  const endToEnd = [];
  const perImage = new Map(images.map(p => [p, []]));

  for (let i = 0; i < RUNS; i++) {
    const image = images[i % images.length];
    const t0 = process.hrtime.bigint();
    const result = await classify(image);
    const e2e = Number(process.hrtime.bigint() - t0) / 1e6;
    inference.push(result.latency_ms);
    endToEnd.push(e2e);
    perImage.get(image).push(result.latency_ms);
    lastPrediction = result;
    if ((i + 1) % 10 === 0 || i === RUNS - 1) {
      process.stdout.write(`\rMeasured ${i + 1}/${RUNS}`);
    }
  }
  process.stdout.write('\n');

  const report = {
    generated_at: new Date().toISOString(),
    model: {
      name: model.name,
      architecture: model.architecture,
      file: model.file,
      bytes: model.bytes,
      sha256: model.sha256,
      classes: model.classes,
      execution_provider: model.execution_provider,
      source: model.source
    },
    host: {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      cpu: (os.cpus()[0] || {}).model || 'unknown',
      logical_cores: os.cpus().length,
      total_memory_gb: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10
    },
    runtime: getRuntimeInfo(),
    methodology: {
      warmup_runs: WARMUP,
      measured_runs: RUNS,
      images: images.map(p => path.basename(p)),
      note: 'Runs cycle through the listed real leaf images. inference_ms measures session.run() only; end_to_end_ms also includes image decode, resize, and normalisation. Latency varies with CPU load and image size.'
    },
    latency_ms: {
      inference: stats(inference),
      end_to_end: stats(endToEnd)
    },
    per_image: [...perImage.entries()].map(([file, values]) => ({
      image: path.basename(file),
      inference: stats(values)
    })),
    sample_prediction: lastPrediction ? {
      label: lastPrediction.prediction.label,
      confidence_percent: lastPrediction.prediction.confidence_percent
    } : null
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nInference latency (session.run): avg ${report.latency_ms.inference.avg} ms, ` +
    `p50 ${report.latency_ms.inference.p50} ms, p95 ${report.latency_ms.inference.p95} ms`);
  console.log(`End-to-end latency (preprocess + inference): avg ${report.latency_ms.end_to_end.avg} ms, ` +
    `p95 ${report.latency_ms.end_to_end.p95} ms`);
  console.log(`\nWrote ${OUT}`);
})().catch(err => {
  console.error('\nBenchmark failed:', err.message);
  process.exit(1);
});
