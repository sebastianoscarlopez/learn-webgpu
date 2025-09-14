# Summary: Cameras in Computer Graphics

This document summarizes the core concepts of virtual cameras in 3D graphics, focusing on the View and Projection matrices.

---

## 1. The Virtual Camera Concept

A virtual camera is an abstraction used to determine how a 3D scene is projected onto a 2D screen. It's defined by:
* **Position**: The camera's location in 3D space (the "eye").
* **Direction**: The point the camera is looking at (the "target").
* **Up Vector**: The direction that is "up" from the camera's perspective, defining its orientation.

---

## 2. The View Matrix: The Camera's View

The **View Matrix** transforms the entire 3D world so that the camera is positioned at the origin `(0, 0, 0)` and looking down a standard axis (typically the **-Z axis** in a right-handed system).

### Key Concepts
* **It moves the world, not the camera.** This simplifies subsequent calculations.
* It's built from the camera's own coordinate system, defined by three perpendicular vectors:
    1.  **Forward Vector (Camera's Z-axis)**: `normalize(Position - Target)`
    2.  **Right Vector (Camera's X-axis)**: `normalize(cross(WorldUp, Forward))`
    3.  **Up Vector (Camera's Y-axis)**: `cross(Forward, Right)`
* **Handedness**: The formulas can change depending on whether the system is **right-handed** (like OpenGL) or **left-handed** (like DirectX). WebGPU often uses a right-handed view space but a left-handed final screen space (NDC), with the flip handled by the projection matrix.

### Final Matrix Structure
The calculated vectors are assembled into a 4x4 matrix that combines rotation and translation.

```
| Rx  Ry  Rz  -(R·P) |
| Ux  Uy  Uz  -(U·P) |
| Fx  Fy  Fz  -(F·P) |
| 0   0   0     1    |
```

---

## 3. The Projection Matrix: The Camera's Lens

The **Projection Matrix** acts as the camera's lens. Its primary job is to take the 3D world, as seen from the camera's point of view, and flatten it into a 2D image. It defines the shape of the camera's viewing volume, known as the **view frustum**, and determines how objects are projected onto your screen.

---
### The View Frustum

The view frustum is the 3D volume of space that the camera can "see." It's defined by six clipping planes (near, far, top, bottom, left, right) that form a container. Anything outside this container is discarded. The projection matrix's main task is to take every 3D point inside this frustum and map it to a standardized cube called **Normalized Device Coordinates (NDC)**, which is easy for the GPU to process.



---
### 1. Perspective Projection (For Realism)

This is the most common type of projection, as it mimics how our eyes perceive the world.

* **Core Principle**: Objects that are farther away appear smaller.
* **How it Works**: It uses a mathematical trick called **perspective division**. The matrix calculates a fourth coordinate, `w`, for each vertex that is proportional to its distance from the camera. The GPU then divides the `x` and `y` coordinates by `w`. A larger distance results in a larger `w`, which makes the final object on the screen smaller.
* **Use Cases**: Almost all 3D games, architectural visualization, and any application where a sense of depth and realism is important.

---
### 2. Orthographic Projection (For Flat Views)

This projection removes all sense of perspective.

* **Core Principle**: An object's size on screen remains the same, regardless of its distance from the camera. Parallel lines always stay parallel.
* **How it Works**: The math is much simpler. It's just a **scaling and translation** operation. It takes the rectangular box of the view volume and uniformly scales it down to fit the NDC cube. The `w` coordinate is not used for division.
* **Use Cases**: 2D games (like platformers or strategy games), user interface (UI) elements like health bars, and technical or architectural blueprints where preserving exact dimensions is crucial.


### Resources

* [Cameras Theory in WebGPU](https://carmencincotti.com/2022-04-25/cameras-theory-webgpu)
* [WebGPU Cameras](https://webgpufundamentals.org/webgpu/lessons/webgpu-cameras.html)
* [Orthographic Projection (also includes Depth Stencil)](https://webgpufundamentals.org/webgpu/lessons/webgpu-orthographic-projection.html)