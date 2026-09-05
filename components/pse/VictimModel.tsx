/* eslint-disable react/no-unknown-property */
import { useLoader } from "@react-three/fiber";
import { Asset } from "expo-asset";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

// Référence statique nécessaire pour inclure le modèle dans les bundles Expo.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const model = require("../../assets/models/male.glb");

const armPose: Record<string, [number, number, number]> = {
  "mixamorig:LeftArm": [0, 0, -1.42],
  "mixamorig:LeftForeArm": [0, 0, -0.08],
  "mixamorig:RightArm": [0, 0, 1.42],
  "mixamorig:RightForeArm": [0, 0, 0.08],
};

type Props = {
  depression: number;
  fallback: ReactNode;
};

function LoadedVictim({ uri, depression }: Omit<Props, "fallback"> & { uri: string }) {
  const gltf = useLoader(GLTFLoader, uri);
  const group = useRef<THREE.Group>(null);
  const scene = useMemo(() => {
    const cloned = cloneSkeleton(gltf.scene);
    cloned.traverse((object) => {
      if (object instanceof THREE.Light || object instanceof THREE.Camera) {
        object.visible = false;
      }
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
      if (object instanceof THREE.SkinnedMesh) object.skeleton.pose();
    });

    // Le modèle est remis dans sa pose de référence, puis les bras de la
    // T-pose Mixamo sont rabattus afin de rester droits le long du corps.
    Object.entries(armPose).forEach(([name, rotation]) => {
      const bone = cloned.getObjectByName(name);
      if (!bone) return;
      bone.quaternion.multiply(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      );
    });
    return cloned;
  }, [gltf.scene]);

  useEffect(() => {
    if (group.current) group.current.position.y = 0.5 - depression * 0.18;
  }, [depression]);

  return (
    <group
      ref={group}
      position={[0, 0.5, 2.15]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={2.4}
    >
      <primitive object={scene} />
    </group>
  );
}

export default function VictimModel({ depression, fallback }: Props) {
  const [uri, setUri] = useState<string>();

  useEffect(() => {
    let active = true;
    Asset.fromModule(model).downloadAsync().then((asset) => {
      if (active) setUri(asset.localUri ?? asset.uri);
    });
    return () => { active = false; };
  }, []);

  if (!uri) return <>{fallback}</>;
  return <LoadedVictim uri={uri} depression={depression} />;
}
