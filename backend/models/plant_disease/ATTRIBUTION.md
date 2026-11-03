# Model attribution and licence notes

## Crop disease classifier

- **Model:** MobileNetV2 (224x224) fine-tuned on the PlantVillage / "New Plant Diseases Dataset" (38 classes).
- **Base model:** `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification`
- **ONNX export:** `onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX`
  - https://huggingface.co/onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX
- **File used by KrishiDrive:** `model.onnx` (float32, 9.2 MB, SHA-256 recorded in `benchmark.json`).
- **Reported accuracy:** 95.41% on the model author's evaluation split of the New Plant Diseases Dataset. This number is reported by the model card, not re-measured by KrishiDrive. KrishiDrive does not claim a field-accuracy figure.
- **License:** the Hugging Face model card declares `license: other` without additional terms. Verify licensing with the model authors before commercial redistribution. The underlying PlantVillage dataset is published by Hughes & Salathé (2015) and is commonly distributed under CC BY-SA 3.0; check the dataset repository for the current terms.
- **Intended use / limitations:** classification of a single leaf photographed against a relatively clean background. It is not a substitute for an agronomist, does not detect nutrient deficiencies, and can be wrong on blurred, distant, or multi-leaf images.

## Sample images

`backend/test/fixtures/leaf_tomato_early_blight.jpg` and `leaf_tomato_healthy.jpg` are sample images from the
[PlantVillage Dataset](https://github.com/spMohanty/PlantVillage-Dataset) (Hughes & Salathé, 2015). They are used only
for automated tests and the local latency benchmark.

## Quantization

The quantized ONNX variants published alongside this model were tested during development and produced incorrect
top-1 predictions on the same sample images (for example, a healthy tomato leaf was classified as Healthy Soybean with
99.99% confidence). They are **not** shipped. Only the float32 model is used and benchmarked.
