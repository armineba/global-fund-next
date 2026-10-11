/**
 * Post-processing per tier. high: mipmap bloom on HDR highlights (> 1),
 * ACES tone mapping, vignette and a whisper of grain, MSAA 4. medium: bloom +
 * vignette, MSAA 2. low / software: no composer (direct ACES rendering).
 * The composer keeps the canvas alpha, so the office shows through.
 */
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import type { TierSettings } from "./quality";

export function PostFX({ tier }: { tier: TierSettings }) {
  if (tier.composer === "none") return null;
  if (tier.composer === "lite") {
    return (
      <EffectComposer multisampling={tier.multisampling} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={0.55} radius={0.62} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.32} darkness={0.5} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={tier.multisampling} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.3} intensity={0.7} radius={0.7} levels={7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.55} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.035} />
    </EffectComposer>
  );
}
