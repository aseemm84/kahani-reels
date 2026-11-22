import React from "react";
import { Figure, Look, Pose } from "../../storyboard/Figure";

// One fixed look per storyboard character, so every scene shows the same figure.
export const LOOKS: Record<string, Look> = {
  hanuman: { skin: "#f08a24", garment: "#c0392b", garmentTrim: "#f2c14e", crown: "#f2c14e", tail: "#e07a1a",
    weapon: "gada", weaponColor: "#f2c14e", jewel: "#f2c14e", aura: "#ffd36b" },
  lakshmana: { skin: "#f3d2b3", garment: "#f1c40f", garmentTrim: "#c0392b", crown: "#f2c14e", hair: "#1d1d2b", bowOnBack: true, weaponColor: "#8a5a1c" },
  rama: { skin: "#4a90a4", garment: "#f1c40f", garmentTrim: "#c0392b", crown: "#f2c14e", hair: "#1d1d2b", bowOnBack: true, weaponColor: "#8a5a1c", aura: "#ffe8a3" },
  sushena: { skin: "#e8c39e", garment: "#f4f1ea", robe: true, beard: "#f4f4f4", hair: "#f4f4f4", jewel: "#b98b4e" },
};

export const POS: Record<string, number> = { "far-left": 160, left: 300, center: 540, right: 780, "far-right": 920, sky: 540 };

export const Char: React.FC<{ id: string; pose: Pose; x?: number; y?: number; scale?: number; flip?: boolean; holding?: React.ReactNode; glow?: number }> = ({
  id, ...rest
}) => <Figure look={LOOKS[id]} {...rest} />;
