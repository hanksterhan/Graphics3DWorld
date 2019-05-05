"use strict";
const Scene = function(gl) {
  this.vsIdle = new Shader(gl, gl.VERTEX_SHADER, "idle_vs.essl");
  this.fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, "solid_fs.essl");
  this.solidProgram = new Program(gl, this.vsIdle, this.fsSolid);

  this.vsTrafo = new Shader(gl, gl.VERTEX_SHADER, "trafo_vs.essl");
  this.fsHeadlight = new Shader(gl, gl.FRAGMENT_SHADER, "headlight_fs.essl");
  this.headlightProgram = new TexturedProgram(gl, this.vsTrafo, this.fsHeadlight);
  this.fsSpotlight = new Shader(gl, gl.FRAGMENT_SHADER, "spotlight_fs.essl");
  this.spotlightProgram = new TexturedProgram(gl, this.vsTrafo, this.fsSpotlight);
  this.fsmarble = new Shader(gl, gl.FRAGMENT_SHADER, "marble_fs.essl");
  this.fsblack = new Shader(gl, gl.FRAGMENT_SHADER, "black_fs.essl");
  this.fsphongblinn = new Shader(gl, gl.FRAGMENT_SHADER, "phongblinn_fs.essl");
  this.phongblinnProgram = new TexturedProgram(gl, this.vsTrafo, this.fsphongblinn);
  this.marbleProgram = new TexturedProgram(gl, this.vsTrafo, this.fsmarble);
  this.vsplane = new Shader(gl, gl.VERTEX_SHADER, "textureplane_vs.essl");
  this.fsplane = new Shader(gl, gl.FRAGMENT_SHADER, "textureplane_fs.essl");
  this.planeProgram = new TexturedProgram(gl, this.vsplane, this.fsplane);
  this.colorProgram = new TexturedProgram(gl, this.vsTrafo, this.fsblack);

  this.texturedQuadGeometry = new TexturedQuadGeometry(gl);
  this.planeGeometry = new PlaneGeometry(gl);
  
  this.fsTextureCube = new Shader(gl, gl.FRAGMENT_SHADER, "texturecube_fs.essl");
  this.texturedCubeProgram = new TexturedProgram(gl, this.vsTrafo, this.fsTextureCube);
  this.slowpokeReflectiveMaterial = new Material(gl, this.texturedCubeProgram);

  this.blackMaterial = new Material(gl, this.colorProgram);
  this.blackMaterial.solidColor.set(0,0,0);

  this.redMaterial = new Material(gl, this.colorProgram);
  this.redMaterial.solidColor.set(1,0,0); 

  this.fsbackground = new Shader(gl, gl.FRAGMENT_SHADER, "background_fs.essl");
  this.vsbackground = new Shader(gl, gl.VERTEX_SHADER, "background_vs.essl");
  this.backgroundProgram = new TexturedProgram(gl, this.vsbackground, this.fsbackground);
  this.backgroundMaterial = new Material(gl, this.backgroundProgram);

  this.timeAtFirstFrame = new Date().getTime();
  this.timeAtLastFrame = this.timeAtFirstFrame;

  // ground zero
  this.planeMaterial = new Material(gl, this.planeProgram);
  this.planeMaterial.colorTexture.set(new Texture2D(gl, "media/water.jpg"));
  this.planeMesh = new Mesh(this.planeGeometry, this.planeMaterial);
  this.plane = new GameObject(this.planeMesh);
  this.plane.position.set(0, 0, 0);

  const genericMove = function(t, dt){
    this.position.y -= dt;
    // this.position.x -= Math.sin(t);
    const acceleration = new Vec3(this.force).mul(this.invMass);
    
    this.velocity.addScaled(dt, acceleration);
    this.velocity.mul(Math.pow(this.backDrag, dt)); //account for drag
    this.position.addScaled(dt, this.velocity);
    
    this.angularAcceleration = this.invAngularMass * this.torque;
    this.angularVelocity += this.angularAcceleration * dt;
    this.angularVelocity *= Math.pow(this.angularDrag, dt); //account for drag
    this.orientation += this.angularVelocity * dt;

    this.ahead = new Vec3(Math.cos(this.orientation), Math.sin(this.orientation), 0);
    this.aheadVelocity = this.ahead.mul(this.ahead.dot(this.velocity))
    this.sideVelocity = this.velocity - this.aheadVelocity;
    this.velocity.set();

    this.velocity.addScaled(Math.pow(this.backDrag, dt), this.aheadVelocity);
    this.velocity.addScaled(Math.pow(this.sideDrag, dt), this.sideVelocity);
  };

  // regular slowpoke with lambertian shading
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
  this.slowpoke = new GameObject(this.slowpokeMesh);
  this.slowpoke.position.set({x:-8, y:2, z:-15});

  // regular slowpoke with phong-blinn lighting
  this.slowpoke1Materials = [
    new Material(gl, this.phongblinnProgram),
    new Material(gl, this.phongblinnProgram),
    ];
  this.slowpoke1Materials[0].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonDh.png'));
  this.slowpoke1Materials[1].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonEyeDh.png'));  

  this.slowpoke1Mesh = new MultiMesh(
    gl, 
    'media/slowpoke/Slowpoke.json', 
    this.slowpoke1Materials
  );
  this.slowpoke1 = new GameObject(this.slowpokeMesh);
  this.slowpoke1.position.set({x:-16, y:2, z:-15});

  
  // marbled slowpoke
  this.slowpokeMarbleMaterials = [
    new Material(gl, this.marbleProgram),
    new Material(gl, this.marbleProgram),
    ];
  this.slowpokeMarbleMesh = new MultiMesh(
    gl, 
    'media/slowpoke/Slowpoke.json', 
    this.slowpokeMarbleMaterials
  );
  this.slowpokeMarble = new GameObject(this.slowpokeMarbleMesh);
  this.slowpokeMarble.position.set({x:18, y:2, z:-15});

  // avatar
  this.avatarMaterials = [
    new Material(gl, this.spotlightProgram),
    new Material(gl, this.spotlightProgram),
  ];
  this.avatarMaterials[0].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonDh.png'));
  this.avatarMaterials[1].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonEyeDh.png'));  

  this.avatarMesh = new MultiMesh(
    gl, 
    'media/slowpoke/Slowpoke.json', 
    this.avatarMaterials
  );
  this.avatar = new GameObject(this.avatarMesh);
  this.avatar.position.set({x:0, y:5, z:-8});

  this.skyCubeTexture = new TextureCube(gl, [
    "media/posx.jpg",
    "media/negx.jpg",
    "media/posy.jpg",
    "media/negy.jpg",
    "media/posz.jpg",
    "media/negz.jpg",
  ]);
  
  this.slowpokeReflectiveMaterial.envmapTexture.set(this.skyCubeTexture);
  // this.backgroundMaterial.envmapTexture.set(this.skyCubeTexture);
  
  this.slowpokeReflectiveMesh = new MultiMesh(
    gl,
    'media/slowpoke/Slowpoke.json',
    [this.slowpokeReflectiveMaterial, this.slowpokeReflectiveMaterial]
  );
  this.slowpokeReflective = new GameObject(this.slowpokeReflectiveMesh);
  this.slowpokeReflective.position.set({x:8, y:4, z:-20});

  // sphere
  this.sphereMesh = new MultiMesh(gl, 'media/sphere/Sphere.json', [this.redMaterial, this.redMaterial]);
  this.sphere = new GameObject(this.sphereMesh);
  this.sphere.scale.set(3, 3, 3);
  this.sphere.position.set({x:0, y:5, z:0});

  // // pikachu 
  // this.pikachuMaterials = [
  //   new Material(gl, this.headlightProgram),
  // ];
  // this.pikachuMaterials[0].colorTexture.set(
  //   new Texture2D(gl, 'media/pikachu/pikachu_texture.png'));

  // this.pikachuMesh = new MultiMesh(gl, 'media/pikachu/Pikachu.json', this.pikachuMaterials);
  // this.pikachu = new GameObject(this.pikachuMesh);
  // this.pikachu.position.set({x:2, y:2, z:0});

  // this.backgroundMesh = new Mesh(this.texturedQuadGeometry, this.backgroundMaterial);

  this.gameObjects = [];
  this.gameObjects.push(this.slowpoke);
  this.gameObjects.push(this.slowpoke1);
  this.gameObjects.push(this.slowpokeReflective);
  this.gameObjects.push(this.avatar);
  this.gameObjects.push(this.slowpokeMarble);
  this.gameObjects.push(this.sphere);
  // this.gameObjects.push(this.pikachu);
  this.gameObjects.push(this.plane);
  // this.gameObjects.push(this.snorlax);
  // this.gameObjects.push(new GameObject(this.backgroundMesh));

  this.camera = new PerspectiveCamera();
  this.camera.position.set(0, 3, 10);

  // directional light:
  Uniforms.lighting.position.at(0).set(1.0, 1.0, 1.0, 0.0);
  Uniforms.lighting.powerDensity.at(0).set(1.0, 1.5, 9.0, 1.0);

  // position light:
  Uniforms.lighting.position.at(1).set(0.0, 20.0, -8.0, 1.0);
  Uniforms.lighting.powerDensity.at(1).set(1000.0, 1000.0, 9000.0, 1.0);

  // set marble properties
  Uniforms.marbleProperties.noiseFreq.set(8.0);
  Uniforms.marbleProperties.noiseExp.set(4.0);
  Uniforms.marbleProperties.noiseAmp.set(50.0);
  Uniforms.marbleProperties.lightColor.set(1.0, 1.0, 1.0);
  Uniforms.marbleProperties.darkColor.set(0.4, 0.1, 0.2);
  

  gl.enable(gl.DEPTH_TEST);

    // calculate difference from the avatar to the sphere
    this.distanceXc = this.avatar.position.x - this.sphere.position.x;
    this.distanceYc = this.avatar.position.y - this.sphere.position.y;
    this.distanceZc = this.avatar.position.z - this.sphere.position.z;
  
    this.distancec = Math.sqrt(Math.pow(this.distanceXc, 2) + Math.pow(this.distanceYc, 2) + Math.pow(this.distanceZc, 2));
    
    this.normalc = new Vec3(this.distanceXc / this.distancec, this.distanceYc / this.distancec, this.distanceZc / this.distancec);

    console.log(this.sphere);
    console.log(this.avatar);
    console.log(this.sphere.scale.x);
    console.log(this.sphere.scale.y);
    console.log(this.avatar.scale.x);
    console.log(this.avatar.scale.y);


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

  if(keysPressed.I){ // move UP
    this.avatar.position.y += 0.1;
    Uniforms.lighting.position.at(1).y += 0.1;
  }
  if(keysPressed.J){ // move LEFT
    this.avatar.position.x -= 0.1;
    Uniforms.lighting.position.at(1).x -= 0.1;
  }
  if(keysPressed.K){ // move DOWN
    this.avatar.position.y -= 0.1;
    Uniforms.lighting.position.at(1).y -= 0.1;
  }
  if(keysPressed.L){ // move RIGHT
    this.avatar.position.x += 0.1;
    Uniforms.lighting.position.at(1).x += 0.1;
  }
  if(keysPressed.U){ // rotate LEFT
    this.avatar.orientation -= 0.1;
  }
  if(keysPressed.O){ // rotate RIGHT
    this.avatar.orientation += 0.1;
  }
  if(keysPressed.N){ // move AWAY
    this.avatar.position.z -= 0.1;
  }
  if(keysPressed.M){ // move CLOSER
    this.avatar.position.z += 0.1;
  }

  // // calculate difference from the avatar to the sphere
  // this.distanceX = this.avatar.position.x - this.sphere.position.x;
  // this.distanceY = this.avatar.position.y - this.sphere.position.y;
  // this.distanceZ = this.avatar.position.z - this.sphere.position.z;

  // this.distance = Math.sqrt(Math.pow(this.distanceX, 2) + Math.pow(this.distanceY, 2) + Math.pow(this.distanceZ, 2));
  
  // this.normal = new Vec3(this.distanceX / this.distance, this.distanceY / this.distance, this.distanceZ / this.distance);

  // if (this.distance < (this.avatar.scale.x + this.sphere.scale.x) || this.distance < (this.avatar.scale.y + this.sphere.scale.y)){
  //   console.log("collision");
  // }

  for(let i=0; i<this.gameObjects.length; i++){
    this.gameObjects[i].draw(this.camera);
  }
  // subtract one from the length because we don't want to draw
  for(let i=0; i<this.gameObjects.length-1; i++){
    this.gameObjects[i].drawShadow(this.camera, this.blackMaterial);
  }
};


