function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function() {
    // Cube data
    const cube_size = 30
    const cube_gap = cube_size * 29 / 67
    var columns = 5
    var rows = 6
    var totalMotifs = 32
    var center = new BABYLON.Vector3(
        (cube_size + cube_gap) * (columns - 1) / 2,
        0,
        (cube_size + cube_gap) * (rows - 1) / 2
    );
    var blockColor = new BABYLON.Color3(0.93, 0.78, 0.10);
    var groundColor = new BABYLON.Color3(0.00, 0.52, 0.65);

    //Camera
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 266, center, scene);
    //camera.attachControl(canvas, true);

    // Lighting
    const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(Math.PI / 4, -1, Math.PI / 5), scene);
    light.intensity = 1.5;
    light.position.y = 30
    const bounceLight = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -1, 0), scene);
    bounceLight.diffuse = blockColor;
    bounceLight.intensity = 1;

    //Card data
    var cards = Array.from(Array(totalMotifs).keys()); // Deal all the motifs
    cards.sort(function(a, b) {
        return getRandomInt(cards.length) - getRandomInt(cards.length); // Shuffle
    });
    cards.sort(function(a, b) {
        return getRandomInt(cards.length) - getRandomInt(cards.length); // Shuffle FIXME: Improve randomization
    });
    console.log(cards)
    cards.length = Math.ceil(columns * rows / 2) // Pick some
    cards = cards.flatMap(i => [i, i]); // Duplicate the cards
    cards.sort(function(a, b) {
        return getRandomInt(cards.length) - getRandomInt(cards.length); // Shuffle again (FIXME?)
    });

    /*************************************Meshes****************************************/
    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 500,
        height: 500,
    }, scene, false);
    ground.position = center;
    ground.position.y = -8;
    ground.rotation.y = Math.PI / 2;

    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.ambientColor = groundColor;
    groundMaterial.diffuseColor = groundColor;
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

    ground.material = groundMaterial;

    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(512, light);
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.darkness = 0.3;
    ground.receiveShadows = true;

    // Cubes
    const blockMaterial = new BABYLON.StandardMaterial("cubeMaterial", scene);
    blockMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    blockMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    blockMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);

    var faceColors = new Array(6).fill(blockColor);
    faceColors[5] = new BABYLON.Color3(1, 1, 1);

    const texture = new BABYLON.Texture("motifs.png", scene);
    const uvColumns = 6;
    const uvRows = 6;
    var faceUV = new Array(6).fill(
        new BABYLON.Vector4(0.9, 0.9, 0.9, 0.9)
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
            var newInstance = BABYLON.MeshBuilder.CreateBox(cards[counter], {
                size: cube_size,
                faceColors: faceColors,
                faceUV: faceUV,
            }, scene);
            newInstance.material = blockMaterial;
            newInstance.faceUV = faceUV
            newInstance.position.x = (cube_size + cube_gap) * i;
            newInstance.position.z = (cube_size + cube_gap) * j;
            newInstance.rotation.y = Math.PI;
            newInstance.scaling.y = 0.5
            shadowGenerator.getShadowMap().renderList.push(newInstance);
            counter = counter + 1;
        }
    }

    /*************************************Logic****************************************/
    var upCards = [];
    var pointerTap = function(mesh) {
        if (mesh != upCards[0] && mesh != upCards[1]) {
            BABYLON.Animation.CreateAndStartAnimation("revealCard", mesh, "rotation.x", 60, 15, 0, Math.PI, 0);
            upCards.push(mesh);
            if (upCards.length == 2) {
                if (upCards[0].name == upCards[1].name) {
                    BABYLON.Animation.CreateAndStartAnimation("discardCard", upCards[0], "scaling", 60, 15, new BABYLON.Vector3(1, 0.5, 1), new BABYLON.Vector3(0, 0, 0), 0);
                    BABYLON.Animation.CreateAndStartAnimation("discardCard", upCards[1], "scaling", 60, 15, new BABYLON.Vector3(1, 0.5, 1), new BABYLON.Vector3(0, 0, 0), 0);
                    upCards.length = 0;
                }
            } else if (upCards.length == 3) {
                BABYLON.Animation.CreateAndStartAnimation("hideCard", upCards[0], "rotation.x", 60, 15, Math.PI, 0, 0);
                BABYLON.Animation.CreateAndStartAnimation("hideCard", upCards[1], "rotation.x", 60, 15, Math.PI, 0, 0);
                upCards[0] = upCards[2];
                upCards.length = 1;
            }
        }
    }
    const canvasParent = document.getElementById('renderCanvas');
    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERTAP:
                if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh != ground) {
                    pointerTap(pointerInfo.pickInfo.pickedMesh)
                } else {
                    canvasParent.requestFullscreen();
                }
                break;
        }
    });

    return scene;
};
const scene = createScene();

engine.runRenderLoop(function() {
    scene.render();
});
window.addEventListener("resize", function() {
    engine.resize();
});
