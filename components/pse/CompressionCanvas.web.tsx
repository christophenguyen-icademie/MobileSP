/* eslint-disable react/no-unknown-property */
import { Canvas } from "@react-three/fiber";
import { StyleSheet, View } from "react-native";
import { CompressionScene } from "./CompressionScene";

export default function CompressionCanvas({ progression, angle }: { progression: number; angle: number }) {
  return (
    <View style={styles.canvas}>
      <Canvas camera={{ position: [6.2, 4.7, 7.4], fov: 43 }} shadows>
        <color attach="background" args={["#edf3f6"]} />
        <ambientLight intensity={1.6} />
        <directionalLight position={[4, 8, 5]} intensity={2.2} castShadow />
        <CompressionScene progression={progression} angle={angle} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({ canvas: { flex: 1 } });
