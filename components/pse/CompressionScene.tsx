/* eslint-disable react/no-unknown-property */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import FirefighterModel from "./FirefighterModel";

type Point = [number, number, number];
type Props = { progression: number; angle: number };

const peau = "#c98f6b";
const tenue = "#17135e";
const pantalon = "#151d38";

const lisser = (debut: number, fin: number, valeur: number) => {
  const t = THREE.MathUtils.clamp((valeur - debut) / (fin - debut), 0, 1);
  return t * t * (3 - 2 * t);
};

const melanger = (a: Point, b: Point, t: number): Point => [
  THREE.MathUtils.lerp(a[0], b[0], t),
  THREE.MathUtils.lerp(a[1], b[1], t),
  THREE.MathUtils.lerp(a[2], b[2], t),
];

function Membre({ debut, fin, rayonDebut, rayonFin = rayonDebut, couleur }: {
  debut: Point; fin: Point; rayonDebut: number; rayonFin?: number; couleur: string;
}) {
  const { milieu, quaternion, longueur } = useMemo(() => {
    const a = new THREE.Vector3(...debut);
    const b = new THREE.Vector3(...fin);
    const direction = b.clone().sub(a);
    return {
      milieu: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()),
      longueur: direction.length(),
    };
  }, [debut, fin]);
  return (
    <mesh position={milieu} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[rayonFin, rayonDebut, longueur, 20]} />
      <meshStandardMaterial color={couleur} roughness={0.76} />
    </mesh>
  );
}

function Articulation({ position, rayon, couleur }: { position: Point; rayon: number; couleur: string }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[rayon, 20, 14]} />
      <meshStandardMaterial color={couleur} roughness={0.75} />
    </mesh>
  );
}

function Victime({ enfoncement }: { enfoncement: number }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.58, -2.0]} scale={[0.88, 0.72, 1]}>
        <sphereGeometry args={[0.5, 30, 22]} />
        <meshStandardMaterial color={peau} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 0.58, -2.46]} scale={[0.9, 0.9, 0.42]}>
        <sphereGeometry args={[0.37, 24, 18]} />
        <meshStandardMaterial color="#4b3028" roughness={0.9} />
      </mesh>
      <Membre debut={[0, 0.5, -1.62]} fin={[0, 0.55, -1.4]} rayonDebut={0.24} rayonFin={0.28} couleur={peau} />

      <mesh castShadow position={[0, 0.69 - enfoncement * 0.32, -0.63]} scale={[1.05, 0.78 - enfoncement * 0.3, 1.2]}>
        <capsuleGeometry args={[0.62, 0.78, 12, 28]} />
        <meshStandardMaterial color="#e5ecef" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0.34]} scale={[0.9, 0.7, 0.85]}>
        <capsuleGeometry args={[0.55, 0.42, 10, 24]} />
        <meshStandardMaterial color="#b8c7cf" roughness={0.9} />
      </mesh>

      <Membre debut={[-0.66, 0.58, -1.1]} fin={[-1.18, 0.35, -0.25]} rayonDebut={0.2} rayonFin={0.17} couleur={peau} />
      <Membre debut={[-1.18, 0.35, -0.25]} fin={[-1.52, 0.24, 0.72]} rayonDebut={0.17} rayonFin={0.12} couleur={peau} />
      <Articulation position={[-1.18, 0.35, -0.25]} rayon={0.18} couleur={peau} />
      <Membre debut={[0.66, 0.58, -1.1]} fin={[1.18, 0.35, -0.25]} rayonDebut={0.2} rayonFin={0.17} couleur={peau} />
      <Membre debut={[1.18, 0.35, -0.25]} fin={[1.52, 0.24, 0.72]} rayonDebut={0.17} rayonFin={0.12} couleur={peau} />
      <Articulation position={[1.18, 0.35, -0.25]} rayon={0.18} couleur={peau} />

      <Membre debut={[-0.38, 0.47, 0.62]} fin={[-0.43, 0.33, 1.65]} rayonDebut={0.3} rayonFin={0.24} couleur="#26324b" />
      <Membre debut={[-0.43, 0.33, 1.65]} fin={[-0.45, 0.28, 2.62]} rayonDebut={0.24} rayonFin={0.16} couleur="#26324b" />
      <Articulation position={[-0.43, 0.33, 1.65]} rayon={0.25} couleur="#26324b" />
      <Membre debut={[0.38, 0.47, 0.62]} fin={[0.43, 0.33, 1.65]} rayonDebut={0.3} rayonFin={0.24} couleur="#26324b" />
      <Membre debut={[0.43, 0.33, 1.65]} fin={[0.45, 0.28, 2.62]} rayonDebut={0.24} rayonFin={0.16} couleur="#26324b" />
      <Articulation position={[0.43, 0.33, 1.65]} rayon={0.25} couleur="#26324b" />
    </group>
  );
}

function Secouriste({ progression, enfoncement }: { progression: number; enfoncement: number }) {
  const approche = lisser(0.18, 0.47, progression);
  const mainReposGauche: Point = [1.45, 1.02, -0.78];
  const mainReposDroite: Point = [1.48, 1.02, -0.2];
  const mainTravailGauche: Point = [0.0, 1.16 - enfoncement, -0.55];
  const mainTravailDroite: Point = [0.02, 1.25 - enfoncement, -0.51];
  const mainGauche = melanger(mainReposGauche, mainTravailGauche, approche);
  const mainDroite = melanger(mainReposDroite, mainTravailDroite, approche);

  const balancement = enfoncement * 0.82;
  const epauleGauche: Point = melanger([1.7, 2.35, -0.55], [0.48, 2.55 - balancement, -0.72], approche);
  const epauleDroite: Point = melanger([1.75, 2.35, 0.02], [0.52, 2.55 - balancement, -0.22], approche);
  const coudeGauche = melanger([1.65, 1.65, -0.7], melanger(epauleGauche, mainGauche, 0.52), approche);
  const coudeDroite = melanger([1.72, 1.65, 0.0], melanger(epauleDroite, mainDroite, 0.52), approche);
  const bassin: Point = [1.92, 1.2, 0.14];
  const cou: Point = melanger([1.72, 2.8, -0.24], [0.66, 2.91 - balancement, -0.43], approche);

  return (
    <group>
      <Membre debut={bassin} fin={cou} rayonDebut={0.43} rayonFin={0.34} couleur={tenue} />
      <mesh castShadow position={[cou[0], cou[1] + 0.35, cou[2]]} scale={[0.86, 1, 0.9]}>
        <sphereGeometry args={[0.36, 28, 20]} />
        <meshStandardMaterial color={peau} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[cou[0] + 0.03, cou[1] + 0.57, cou[2] - 0.03]} scale={[0.88, 0.5, 0.92]}>
        <sphereGeometry args={[0.37, 24, 18]} />
        <meshStandardMaterial color="#121b38" roughness={0.9} />
      </mesh>

      <Membre debut={epauleGauche} fin={coudeGauche} rayonDebut={0.18} rayonFin={0.15} couleur={tenue} />
      <Membre debut={coudeGauche} fin={mainGauche} rayonDebut={0.15} rayonFin={0.11} couleur={peau} />
      <Articulation position={coudeGauche} rayon={0.155} couleur={peau} />
      <Membre debut={epauleDroite} fin={coudeDroite} rayonDebut={0.18} rayonFin={0.15} couleur={tenue} />
      <Membre debut={coudeDroite} fin={mainDroite} rayonDebut={0.15} rayonFin={0.11} couleur={peau} />
      <Articulation position={coudeDroite} rayon={0.155} couleur={peau} />

      <mesh castShadow position={mainGauche} rotation={[0, 0.08, 0]} scale={[1, 0.6, 1]}>
        <capsuleGeometry args={[0.17, 0.3, 8, 18]} />
        <meshStandardMaterial color={peau} />
      </mesh>
      <mesh castShadow position={mainDroite} rotation={[0, -0.08, 0]} scale={[1, 0.6, 1]}>
        <capsuleGeometry args={[0.17, 0.3, 8, 18]} />
        <meshStandardMaterial color="#d49a75" />
      </mesh>

      <Membre debut={[1.7, 1.16, -0.08]} fin={[2.62, 0.3, -0.62]} rayonDebut={0.3} rayonFin={0.25} couleur={pantalon} />
      <Membre debut={[2.62, 0.3, -0.62]} fin={[3.28, 0.22, -1.35]} rayonDebut={0.25} rayonFin={0.16} couleur={pantalon} />
      <Articulation position={[2.62, 0.3, -0.62]} rayon={0.28} couleur={pantalon} />
      <Membre debut={[2.08, 1.14, 0.36]} fin={[2.77, 0.3, 0.75]} rayonDebut={0.3} rayonFin={0.25} couleur={pantalon} />
      <Membre debut={[2.77, 0.3, 0.75]} fin={[3.38, 0.22, 1.38]} rayonDebut={0.25} rayonFin={0.16} couleur={pantalon} />
      <Articulation position={[2.77, 0.3, 0.75]} rayon={0.28} couleur={pantalon} />
    </group>
  );
}

export function CompressionScene({ progression, angle }: Props) {
  const scene = useRef<THREE.Group>(null);
  const actif = progression >= 0.48 && progression < 1;
  const cycle = actif ? (1 - Math.cos(((progression - 0.48) / 0.52) * Math.PI * 36)) / 2 : 0;
  const enfoncement = cycle * 0.11;

  useFrame(() => {
    if (scene.current) scene.current.rotation.y = THREE.MathUtils.lerp(scene.current.rotation.y, angle, 0.1);
  });

  return (
    <group ref={scene} rotation={[0, angle, 0]}>
      <mesh receiveShadow position={[0.7, 0, 0]}>
        <boxGeometry args={[8.5, 0.12, 6.5]} />
        <meshStandardMaterial color="#d8e1e7" roughness={0.96} />
      </mesh>
      <Victime enfoncement={enfoncement} />
      <FirefighterModel
        progression={progression}
        enfoncement={enfoncement}
        fallback={<Secouriste progression={progression} enfoncement={enfoncement} />}
      />

      {progression >= 0.34 && (
        <group position={[0, 1.68 - enfoncement, -0.52]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.11, 0.3, 18]} />
            <meshStandardMaterial color="#e63946" emissive="#74151d" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.42, 12]} />
            <meshStandardMaterial color="#e63946" />
          </mesh>
        </group>
      )}
    </group>
  );
}
