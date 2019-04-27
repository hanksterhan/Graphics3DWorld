"use strict";
const Scene = function(gl) {
  this.vsIdle = new Shader(gl, gl.VERTEX_SHADER, "idle_vs.essl");
  this.fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, "solid_fs.essl");
  this.solidProgram = new Program(gl, this.vsIdle, this.fsSolid);

  this.vsTrafo = new Shader(gl, gl.VERTEX_SHADER, "trafo_vs.essl");
  this.fsHeadlight = new Shader(gl, gl.FRAGMENT_SHADER, "headlight_fs.essl");
  this.headlightProgram = new TexturedProgram(gl, this.vsTrafo, this.fsHeadlight);
  this.texturedQuadGeometry = new TexturedQuadGeometry(gl);  
  
  this.fsTextureCube = new Shader(gl, gl.FRAGMENT_SHADER, "texturecube_fs.essl");
  this.texturedCubeProgram = new TexturedProgram(gl, this.vsTrafo, this.fsTextureCube);
  this.slowpokeMaterial = new Material(gl, this.texturedCubeProgram);

  this.fsbackground = new Shader(gl, gl.FRAGMENT_SHADER, "background_fs.essl");
  this.vsbackground = new Shader(gl, gl.VERTEX_SHADER, "background_vs.essl");
  this.backgroundProgram = new TexturedProgram(gl, this.vsbackground, this.fsbackground);
  this.backgroundMaterial = new Material(gl, this.backgroundProgram);

  this.timeAtFirstFrame = new Date().getTime();
  this.timeAtLastFrame = this.timeAtFirstFrame;

  this.slowpokeMaterials = [
    new Material(gl, this.headlightProgram),
    new Material(gl, this.headlightProgram),
    ];
  this.slowpokeMaterials[0].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonDh.png'));
  this.slowpokeMaterials[1].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonEyeDh.png'));  

  this.slowpokeMesh = new MultiMesh(
    gl, 
    'media/slowpoke/Slowpoke.json', 
    this.slowpokeMaterials
  );
  // this.skyCubeTexture = new TextureCube(gl, [
  //   "media/posx.jpg",
  //   "media/negx.jpg",
  //   "media/posy.jpg",
  //   "media/negy.jpg",
  //   "media/posz.jpg",
  //   "media/negz.jpg",
  // ]);
  
  // this.slowpokeMaterial.envmapTexture.set(this.skyCubeTexture);
  // this.backgroundMaterial.envmapTexture.set(this.skyCubeTexture);
  
  // this.slowpokeMesh = new MultiMesh(
  //   gl,
  //   'media/slowpoke/Slowpoke.json',
  //   [this.slowpokeMaterial, this.slowpokeMaterial]
  // );

  // this.backgroundMesh = new Mesh(this.texturedQuadGeometry, this.backgroundMaterial);

  this.gameObjects = [];
  this.gameObjects.push(new GameObject(this.slowpokeMesh));
  // this.gameObjects.push(new GameObject(this.backgroundMesh));

  this.camera = new PerspectiveCamera();

  Uniforms.lighting.position.at(0).set(1.0, 1.0, 1.0, 1.0);
  Uniforms.lighting.powerDensity.at(0).set(1.0, 1.0, 9.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

};

Scene.prototype.update = function(gl, keysPressed) {
  //jshint bitwise:false
  //jshint unused:false
  const timeAtThisFrame = new Date().getTime();
  const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
  const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0; 
  this.timeAtLastFrame = timeAtThisFrame;

  // clear the screen
  gl.clearColor(0.3, 0.0, 0.3, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  this.camera.move(dt, keysPressed);
  Uniforms.camera.position.set(this.camera.position);
  Uniforms.camera.rayDirMatrix.set(this.camera.rayDirMatrix);

  for(let i=0; i<this.gameObjects.length; i++){
    this.gameObjects[i].draw(this.camera);
  }
};


