var assert = require ('assert');
var testUtils = require ('../utils/testutils.js');

describe ('Model Utils', function () {
    it ('Create Merged Model', function () {
        var model = new OV.Model ();
        
        var mesh1 = new OV.Mesh ();
        mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh1.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh1);

        var mesh2 = new OV.Mesh ();
        mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh2.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh2);

        OV.FinalizeModel (model, function () { return new OV.Material (); });
        assert.deepStrictEqual (testUtils.ModelToObject (model), {
            name : '',
            materials : [
                { name : '' }
            ],
            meshes : [
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }
                    ]
                },
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 1, 1, 0, 1, 1, 1, 1],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }
                    ]
                }
            ]
        });

        var mergedModel = OV.CreateMergedModel (model);
        assert.deepStrictEqual (testUtils.ModelToObject (mergedModel), {
            name : '',
            materials : [
                { name : '' }
            ],
            meshes : [
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        },
                        {
                            vertices : [0, 0, 1, 1, 0, 1, 1, 1, 1],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }                        
                    ]
                }
            ]
        });        
    });

    it ('Mesh Bounding Box', function () {
        var cube = testUtils.GetCubeMesh ();
        let cubeBounds = OV.GetMeshBoundingBox (cube);
        assert (OV.CoordIsEqual3D (cubeBounds.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (cubeBounds.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });

    it ('Model Bounding Box', function () {
        var model = new OV.Model ();
        
        var mesh1 = new OV.Mesh ();
        mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh1.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh1);

        var mesh2 = new OV.Mesh ();
        mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh2.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh2);

        OV.FinalizeModel (model, function () { return new OV.Material (); });

        let mesh1Bounds = OV.GetMeshBoundingBox (model.GetMesh (0));
        assert (OV.CoordIsEqual3D (mesh1Bounds.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (mesh1Bounds.max, new OV.Coord3D (1.0, 1.0, 0.0)));

        let mesh2Bounds = OV.GetMeshBoundingBox (model.GetMesh (1));
        assert (OV.CoordIsEqual3D (mesh2Bounds.min, new OV.Coord3D (0.0, 0.0, 1.0)));
        assert (OV.CoordIsEqual3D (mesh2Bounds.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });

    it ('Mesh Volume Calculation', function () {
        function GetTriangleArea (v0, v1, v2)
        {
            let a = OV.CoordDistance3D (v0, v1);
            let b = OV.CoordDistance3D (v1, v2);
            let c = OV.CoordDistance3D (v0, v2);
            let s = (a + b + c) / 2.0;
            let areaSquare = s * (s - a) * (s - b) * (s - c);
            if (areaSquare < 0.0) {
                return 0.0;
            }
            return Math.sqrt (areaSquare);
        }

        var model = testUtils.GetModelWithOneMesh (testUtils.GetCubeMesh ());
        let surface = 0.0;
        let volume = 0.0;
        for (let i = 0; i < model.MeshCount (); i++) {
            let mesh = model.GetMesh (i);
            for (j = 0; j < mesh.TriangleCount (); j++) {
                let triangle = mesh.GetTriangle (j);
                let v0 = mesh.GetVertex (triangle.v0);
                let v1 = mesh.GetVertex (triangle.v1);
                let v2 = mesh.GetVertex (triangle.v2);
                surface += GetTriangleArea (v0, v1, v2);
                let signedVolume = OV.DotVector3D (v0, OV.CrossVector3D (v1, v2)) / 6.0;
                volume += signedVolume;
            }
        }
        assert (OV.IsEqual (volume, 1.0));
        assert (OV.IsEqual (surface, 6.0));
    });

    it ('Tetrahedron Topology Calculation', function () {
        let tetrahedron = testUtils.GetModelWithOneMesh (testUtils.GetTetrahedronMesh ());
        let topology = OV.GetModelTopology (tetrahedron);
        assert.strictEqual (topology.vertices.length, 4);
        assert.strictEqual (topology.edges.length, 6);
        assert.strictEqual (topology.triangleEdges.length, 4 * 3);
        assert.strictEqual (topology.triangles.length, 4);
        for (let i = 0; i < topology.vertices.length; i++) {
            assert.strictEqual (topology.vertices[i].edges.length, 3);
            assert.strictEqual (topology.vertices[i].triangles.length, 3);
        }
        for (let i = 0; i < topology.edges.length; i++) {
            assert.strictEqual (topology.edges[i].triangles.length, 2);
        }
    });  

    it ('Cube Topology Calculation', function () {
        let cube = testUtils.GetModelWithOneMesh (testUtils.GetCubeMesh ());
        let topology = OV.GetModelTopology (cube);
        assert.strictEqual (topology.vertices.length, 8);
        assert.strictEqual (topology.edges.length, 12 + 6);
        assert.strictEqual (topology.triangleEdges.length, 6 * 2 * 3);
        assert.strictEqual (topology.triangles.length, 6 * 2);

        let verticesWith4Triangles = 0;
        let verticesWith5Triangles = 0;
        let verticesWith4Edges = 0;
        let verticesWith5Edges = 0;
        for (let i = 0; i < topology.vertices.length; i++) {
            if (topology.vertices[i].triangles.length == 4) {
                verticesWith4Triangles += 1;
            } else if (topology.vertices[i].triangles.length == 5) {
                verticesWith5Triangles += 1;
            }
            if (topology.vertices[i].edges.length == 4) {
                verticesWith4Edges += 1;
            } else if (topology.vertices[i].edges.length == 5) {
                verticesWith5Edges += 1;
            }
        }
        assert.strictEqual (verticesWith4Triangles, 4);
        assert.strictEqual (verticesWith5Triangles, 4);
        assert.strictEqual (verticesWith4Edges, 4);
        assert.strictEqual (verticesWith5Edges, 4);

        for (let i = 0; i < topology.edges.length; i++) {
            assert.strictEqual (topology.edges[i].triangles.length, 2);
        }
    });    
});
