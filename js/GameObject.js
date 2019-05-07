"use strict"; 
const GameObject = function(mesh) { 
  this.mesh = mesh;

  this.parent = null;

  this.position = new Vec3(0, 0, 0); 
  this.orientation = 0; 
  this.scale = new Vec3(1, 1, 1); 

  this.modelMatrix = new Mat4(); 
  this.rotationMatrix = new Vec3(0, 1, 0);

  this.move = function(){};
  this.control = function(){};
  this.force = new Vec3();
  this.torque = 0;
  this.velocity = new Vec3();
  this.invMass = 1; 
  this.backDrag = 1;
  this.sideDrag = 1; 
  this.angularVelocity = 0;
  this.angularDrag = 1;
};

GameObject.prototype.updateModelMatrix =
                              function(){ 
// TODO: set the game object’s model matrix property according to the position, orientation, and scale
  this.modelMatrix.set().
    scale(this.scale).
    rotate(this.orientation, 0, this.orientation).
    translate(this.position);
  if (this.parent){
    this.parent.updateModelMatrix();
    this.modelMatrix.mul(this.parent.modelMatrix);
  }
};

GameObject.prototype.draw = function(camera){ 
  this.updateModelMatrix();
// TODO: Set the uniform modelViewProjMatrix (reflected in the material) from the modelMatrix property of GameObject (no camera yet). Operator = cannot be used. Use Mat4’s methods set() and/or mul().
  Uniforms.gameObject.animScale.set(1, 1);
  Uniforms.gameObject.modelViewProjMatrix.set(this.modelMatrix).mul(camera.viewProjMatrix);
  Uniforms.gameObject.modelMatrixInverse.set(this.modelMatrix).invert();
  Uniforms.gameObject.modelMatrix.set(this.modelMatrix);
  this.mesh.draw(); 
};

GameObject.prototype.drawShadow = function(camera, material){
  this.updateModelMatrix();
  Uniforms.gameObject.animScale.set(1, 1);
  
  this.modelMatrix.
    scale(new Vec3(1, 0, 1)). 
    translate(new Vec3(0, 0.1, 0));
    
  Uniforms.gameObject.modelViewProjMatrix.set(this.modelMatrix).mul(camera.viewProjMatrix);
  Uniforms.gameObject.modelMatrixInverse.set(this.modelMatrix).invert();
  Uniforms.gameObject.modelMatrix.set(this.modelMatrix);
  this.mesh.drawSelected(material); 
}
