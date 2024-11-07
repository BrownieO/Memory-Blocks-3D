const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true); 

const createScene = function () {
    // Cube data
    const cube_size = 30
    const cube_gap = cube_size * 29/67
    var rows = 5
    var columns = 6
	var center = new BABYLON.Vector3((cube_size + cube_gap) * columns / 2 - cube_gap, 0, (cube_size + cube_gap) * rows / 2 - cube_gap);
    var blockColor = new BABYLON.Color3(0.41, 0.77, 0.98);
	
	//Camera
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 300, new BABYLON.Vector3(0, 0, 0), scene);
    camera.target = center;
    camera.attachControl(canvas, true);

    //camera.upperBetaLimit = (Math.PI / 2) * 0.99;

    // Light
	scene.ambientColor = new BABYLON.Color3(1, 1, 1);
    //const light = new BABYLON.PointLight("omni", new BABYLON.Vector3(50, 200, 100), scene);
    //light.intensity = 0.8

	//Card data
	var cards = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14
	];
	cards = cards.flatMap(i => [i,i]);

	function getRandomInt(max) {
	  return Math.floor(Math.random() * Math.floor(max));
	}

	cards.sort(function(a, b) {
	  return getRandomInt(cards.length) - getRandomInt(cards.length);
	});

    /*************************************Meshes****************************************/
    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:1000, height:1000}, scene, false);

    // Cubes
    const blockMaterial = new BABYLON.StandardMaterial("cubeMaterial", scene);
    blockMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
	blockMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
	
    var faceColors = new Array(6).fill(blockColor);
	faceColors[5] = new BABYLON.Color3(1, 1, 1);
	
	const texture = new BABYLON.Texture("https://i.ibb.co/rtpR8tH/lazytown.png", scene);
	const uvColumns = 6;
	const uvRows = 6;
	var faceUV = new Array(6).fill(
		new BABYLON.Vector4(1,1,1,1)
	);

	blockMaterial.diffuseTexture = texture;
	
	var counter = 0
    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
			faceUV[5] =
				new BABYLON.Vector4(
					(cards[counter] % 6) / 6,
					Math.floor(cards[counter] / 6) / 6,
					(cards[counter] % 6 + 1) / 6,
					Math.floor(cards[counter] / 6 + 1) / 6
				);
			var newInstance = BABYLON.MeshBuilder.CreateBox(cards[counter], {size:cube_size, faceColors:faceColors, faceUV:faceUV, updatable:true}, scene);
			newInstance.material = blockMaterial;
			newInstance.faceUV = faceUV
            newInstance.position.x = (cube_size + cube_gap) * i;
            newInstance.position.z = (cube_size + cube_gap) * j;
			newInstance.rotation.y = Math.PI / 2
			newInstance.isVisible = true;
			counter = counter + 1;
        }
    } 

    /*************************************Logic****************************************/
	var upCards = [];
    var pointerTap = function (mesh) {
		if (mesh.rotation.z == 0) {
			console.log(mesh.name);
            mesh.rotation.z = Math.PI;
			upCards.push(mesh);
			if (upCards.length == 2) {
				if (upCards[0].name == upCards[1].name) {
					upCards[0].dispose();
					upCards[1].dispose();
					upCards.length = 0;
				}
			}
			else if (upCards.length == 3) {
				upCards[0].rotation.z = 0;
				upCards[1].rotation.z = 0;
				upCards[0] = upCards[2];
				upCards.length = 1;
			}
		}
    }

    scene.onPointerObservable.add((pointerInfo) => {      		
        switch (pointerInfo.type) {
			case BABYLON.PointerEventTypes.POINTERTAP:          
				if(pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh != ground) {
                    pointerTap(pointerInfo.pickInfo.pickedMesh)
                }
				break;
        }
    });

    return scene;
};
const scene = createScene();
engine.runRenderLoop(function () {
		scene.render();
});
window.addEventListener("resize", function () {
		engine.resize();
});