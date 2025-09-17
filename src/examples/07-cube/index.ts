/// <reference types="@webgpu/types" />
import { ObjectRenderer } from './renderer';
import {OBJLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

import modelPath from '@/objects/cube.obj?url';
import { mat4 } from 'wgpu-matrix';
import {
  makeShaderDataDefinitions,
  makeStructuredView,
} from 'webgpu-utils';

export async function initDemo (canvas: HTMLCanvasElement) {
  // Import shader code
  const vertexShader = await fetch(new URL('./shaders/vertex.wgsl', import.meta.url).href).then(r => r.text());
  const fragmentShader = await fetch(new URL('./shaders/fragment.wgsl', import.meta.url).href).then(r => r.text());

  const objModel = await load(modelPath, OBJLoader);
  const shaderDataDefinitions = makeShaderDataDefinitions(vertexShader);

  const bufferSize = objModel.attributes.POSITION.value.length / 3 * 4 * 4;
  const verticesView = makeStructuredView(shaderDataDefinitions.storages.vertices, new ArrayBuffer(bufferSize));

  // split the vertices data matrices 3xn
  const verticesData = new Array<number[]>(objModel.attributes.POSITION.value.length / 3);
  for (let i = 0; i < objModel.attributes.POSITION.value.length / 3; i++) {
    verticesData[i] = [objModel.attributes.POSITION.value[i * 3], objModel.attributes.POSITION.value[i * 3 + 1], objModel.attributes.POSITION.value[i * 3 + 2]];
  }
  verticesView.set(verticesData);

  const vertices = new Float32Array(verticesView.arrayBuffer);

  // normals
  const normalsView = makeStructuredView(shaderDataDefinitions.storages.normals, new ArrayBuffer(bufferSize));
  const normalsData = new Array<number[]>(objModel.attributes.NORMAL.value.length / 3);
  for (let i = 0; i < objModel.attributes.NORMAL.value.length / 3; i++) {
    normalsData[i] = [objModel.attributes.NORMAL.value[i * 3], objModel.attributes.NORMAL.value[i * 3 + 1], objModel.attributes.NORMAL.value[i * 3 + 2]];
  }
  normalsView.set(normalsData);
  const normals = new Float32Array(normalsView.arrayBuffer);

  try {
    // Create and initialize the renderer
    const renderer = new ObjectRenderer(canvas, vertexShader, fragmentShader, {
      modelMatrix: mat4.identity(),
      positions: vertices,
      normals: normals,
    });
    await renderer.initialize();

    // Render the triangle
    renderer.render();

    return renderer;
  } catch (error) {
    console.error('Failed to initialize WebGPU:', error);
    throw error;
  }
}

export default {
  title: 'Cubes',
  description: 'Hello World of 3D rendering in WebGPU',
  initDemo,
};