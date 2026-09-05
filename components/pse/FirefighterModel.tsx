/* eslint-disable react/no-unknown-property */
import { useLoader } from "@react-three/fiber";
import { Asset } from "expo-asset";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as clonerSquelette } from "three/examples/jsm/utils/SkeletonUtils.js";

// Metro exige une référence statique pour inclure le GLB dans les bundles natifs.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const modele = require("../../assets/models/firefighter.glb");

type Props = {
  progression: number;
  enfoncement: number;
  fallback: ReactNode;
};

const rotations: Record<string, [number, number, number]> = {
  "mixamorig:Spine_02": [-0.48, 0, 0],
  "mixamorig:Spine1_03": [-0.38, 0, 0],
  "mixamorig:Spine2_04": [-0.3, 0, 0],
  "mixamorig:LeftArm_011": [0.18, 0.15, -1.24],
  "mixamorig:LeftForeArm_012": [0, 0.04, -0.12],
  "mixamorig:RightArm_035": [0.18, -0.15, 1.24],
  "mixamorig:RightForeArm_036": [0, -0.04, 0.12],
  "mixamorig:LeftHand_013": [0.08, 0.22, 0],
  "mixamorig:RightHand_037": [-0.08, -0.22, 0],
  "mixamorig:LeftUpLeg_062": [-1.2, 0.08, -0.1],
  "mixamorig:LeftLeg_063": [1.95, 0, 0],
  "mixamorig:LeftFoot_064": [-0.65, 0, 0],
  "mixamorig:RightUpLeg_057": [-1.2, -0.08, 0.1],
  "mixamorig:RightLeg_058": [1.95, 0, 0],
  "mixamorig:RightFoot_059": [-0.65, 0, 0],
};

function PersonnageCharge({ uri, progression, enfoncement }: Omit<Props, "fallback"> & { uri: string }) {
  const gltf = useLoader(GLTFLoader, uri);
  const groupe = useRef<THREE.Group>(null);
  const { scene, bases, hancheY } = useMemo(() => {
    const clone = clonerSquelette(gltf.scene);
    clone.traverse((objet) => {
      if (!(objet instanceof THREE.Mesh)) return;
      objet.castShadow = true;
      objet.receiveShadow = true;
      const materiaux = Array.isArray(objet.material) ? objet.material : [objet.material];
      const modifies = materiaux.map((original) => {
        const materiau = original.clone() as THREE.MeshStandardMaterial;
        const nom = materiau.name.toLowerCase();
        if (nom.includes("hat") || nom.includes("eyewear")) {
          materiau.visible = false;
        } else if (nom.includes("glove")) {
          materiau.map = null;
          materiau.color.set("#39bce7");
          materiau.roughness = 0.48;
        } else if (nom.includes("top")) {
          materiau.map = null;
          materiau.color.set("#182b58");
          materiau.roughness = 0.82;
        } else if (nom.includes("bottom")) {
          materiau.map = null;
          materiau.color.set("#101e3d");
          materiau.roughness = 0.86;
        } else if (nom.includes("shoe")) {
          materiau.color.set("#15171b");
        }
        return materiau;
      });
      objet.material = Array.isArray(objet.material) ? modifies : modifies[0];
    });

    const poses = new Map<string, THREE.Quaternion>();
    Object.keys(rotations).forEach((nom) => {
      const os = clone.getObjectByName(nom);
      if (os) poses.set(nom, os.quaternion.clone());
    });
    const hanche = clone.getObjectByName("mixamorig:Hips_01");
    return { scene: clone, bases: poses, hancheY: hanche?.position.y ?? 0 };
  }, [gltf.scene]);

  const approche = THREE.MathUtils.smoothstep(progression, 0.18, 0.48);
  useEffect(() => {
    Object.entries(rotations).forEach(([nom, rotation]) => {
      const os = scene.getObjectByName(nom);
      const base = bases.get(nom);
      if (!os || !base) return;
      const cible = base.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)));
      os.quaternion.copy(base).slerp(cible, approche);
    });
    const hanche = scene.getObjectByName("mixamorig:Hips_01");
    if (hanche) hanche.position.y = hancheY - approche * 47 - enfoncement * 55;
    if (groupe.current) groupe.current.position.y = 0.1 - enfoncement * 0.48;
  }, [approche, bases, enfoncement, hancheY, scene]);

  return (
    <group ref={groupe} position={[1.95, 0.1, 0.18]} rotation={[0, -Math.PI / 2, 0]} scale={0.023}>
      <primitive object={scene} />
    </group>
  );
}

export default function FirefighterModel({ progression, enfoncement, fallback }: Props) {
  const [uri, setUri] = useState<string>();

  useEffect(() => {
    let actif = true;
    Asset.fromModule(modele).downloadAsync().then((asset) => {
      if (actif) setUri(asset.localUri ?? asset.uri);
    });
    return () => { actif = false; };
  }, []);

  if (!uri) return <>{fallback}</>;
  return <PersonnageCharge uri={uri} progression={progression} enfoncement={enfoncement} />;
}
