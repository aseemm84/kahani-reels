import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * Parametric storybook figure for storyboard reels. One drawing, many poses, so a character looks identical in
 * every scene. Origin = between the feet; height ≈ 620 px at scale 1. Build each character by fixing a `look`.
 */
export type Pose =
  | "standing" | "walking" | "running" | "flying" | "sitting" | "meditating" | "blessing" | "fighting"
  | "carrying" | "bowing" | "dancing" | "sleeping" | "pointing" | "praying";

export type Look = {
  skin: string;
  garment: string; // dhoti / robe colour
  garmentTrim?: string;
  top?: string; // upper cloth (uttarīya); default = bare torso in skin colour
  crown?: string; // gold crown colour; omit for none
  hair?: string;
  beard?: string; // e.g. white for a sage
  robe?: boolean; // long robe instead of dhoti (sages, women)
  tail?: string; // e.g. Hanumān
  weapon?: "gada" | "bow" | "trishula" | "chakra" | "flute" | "none";
  weaponColor?: string;
  bowOnBack?: boolean;
  aura?: string; // halo colour for divine figures
  jewel?: string; // necklace / armlets colour
};

type Angles = { armL: number; armR: number; legL: number; legR: number; tilt: number; lift: number; lie: number; sit: number };

const POSES = (p: Pose, f: number): Angles => {
  const s = Math.sin(f / 5), b = Math.sin(f / 14);
  const base: Angles = { armL: 12, armR: -12, legL: 4, legR: -4, tilt: 0, lift: 0, lie: 0, sit: 0 };
  switch (p) {
    case "walking": return { ...base, armL: 18 * s, armR: -18 * s, legL: 16 * s, legR: -16 * s, lift: Math.abs(s) * 6 };
    case "running": return { ...base, armL: 45 * s, armR: -45 * s, legL: 35 * s, legR: -35 * s, tilt: 8, lift: Math.abs(s) * 18 };
    case "flying": return { ...base, armL: 160, armR: 150, legL: -25, legR: -40, tilt: 55 + 4 * b, lift: 10 * b };
    case "sitting": return { ...base, armL: 25, armR: -25, legL: 80, legR: 80, sit: 1 };
    case "meditating": return { ...base, armL: 35, armR: -35, legL: 90, legR: -90, sit: 1 };
    case "blessing": return { ...base, armR: -150 + 4 * b };
    case "fighting": return { ...base, armR: -130 + 25 * s, armL: 40, legL: 20, legR: -20 };
    case "carrying": return { ...base, armR: -175, armL: 30, legL: -20, legR: -45, tilt: 30 + 3 * b, lift: 8 * b };
    case "bowing": return { ...base, armL: 50, armR: -50, tilt: 28 };
    case "dancing": return { ...base, armL: 120 + 20 * s, armR: -120 + 20 * s, legL: 25 * s, legR: -10, lift: Math.abs(s) * 10 };
    case "sleeping": return { ...base, armL: 10, armR: -10, lie: 1 };
    case "pointing": return { ...base, armR: -135 };
    case "praying": return { ...base, armL: 62, armR: -62 };
    default: return { ...base, armL: 10 + 2 * b, armR: -10 - 2 * b };
  }
};

const Weapon: React.FC<{ kind?: Look["weapon"]; color: string }> = ({ kind, color }) => {
  switch (kind) {
    case "gada": return (<g><rect x={-6} y={-10} width={12} height={150} rx={6} fill="#8a5a1c" /><circle cx={0} cy={150} r={38} fill={color} /><circle cx={-10} cy={140} r={10} fill="#fff" opacity={0.35} /></g>);
    case "trishula": return (<g><rect x={-5} y={-120} width={10} height={260} fill="#9aa3b5" /><path d="M -40 -150 Q -40 -110 0 -110 Q 40 -110 40 -150 M 0 -170 L 0 -110" stroke={color} strokeWidth={10} fill="none" /></g>);
    case "flute": return <rect x={-6} y={-60} width={12} height={150} rx={6} fill={color} transform="rotate(70)" />;
    case "chakra": return (<g><circle cx={0} cy={-30} r={34} fill="none" stroke={color} strokeWidth={10} /><circle cx={0} cy={-30} r={8} fill={color} /></g>);
    case "bow": return <path d="M 0 -110 Q 60 0 0 110" stroke={color} strokeWidth={9} fill="none" />;
    default: return null;
  }
};

export const Figure: React.FC<{
  look: Look; pose?: Pose; x?: number; y?: number; scale?: number; flip?: boolean; holding?: React.ReactNode; glow?: number;
}> = ({ look, pose = "standing", x = 540, y = 1250, scale = 1, flip = false, holding, glow = 0 }) => {
  const f = useCurrentFrame();
  const a = POSES(pose, f);
  const breathe = Math.sin(f / 16) * 3;
  const blink = f % 96 < 4 ? 0.15 : 1;
  const trim = look.garmentTrim ?? "#f2c14e", jewel = look.jewel ?? "#f2c14e", top = look.top ?? look.skin;
  const legLen = a.sit ? 70 : 190;
  const hipY = -legLen - 20;
  const shoulderY = hipY - 190;
  const arm = (side: -1 | 1, ang: number, hand?: React.ReactNode) => (
    <g transform={`translate(${side * 78} ${shoulderY + 18}) rotate(${ang})`}>
      <rect x={-17} y={0} width={34} height={175} rx={17} fill={look.skin} stroke="rgba(0,0,0,0.28)" strokeWidth={4} />
      <rect x={-19} y={40} width={38} height={14} rx={7} fill={jewel} />
      <circle cx={0} cy={180} r={22} fill={look.skin} stroke="rgba(0,0,0,0.28)" strokeWidth={4} />
      {hand ? <g transform="translate(0 185)">{hand}</g> : null}
    </g>
  );
  const praying = pose === "praying" || pose === "bowing";
  const rightHand = holding ?? (look.weapon && look.weapon !== "bow" && look.weapon !== "none" ? <Weapon kind={look.weapon} color={look.weaponColor ?? "#f2c14e"} /> : null);
  const body = (
    <g transform={`translate(0 ${-a.lift + breathe * 0.3}) rotate(${a.tilt} 0 ${hipY})`}>
      {look.aura ? <circle cx={0} cy={shoulderY - 120} r={150 + 8 * Math.sin(f / 10)} fill={look.aura} opacity={0.22 + glow * 0.3} /> : null}
      {look.tail ? (
        <path d={`M 0 ${hipY} C -120 ${hipY + 40}, -170 ${hipY - 140}, ${-110 + 15 * Math.sin(f / 12)} ${hipY - 260}`}
          stroke={look.tail} strokeWidth={26} fill="none" strokeLinecap="round" />
      ) : null}
      {look.bowOnBack || look.weapon === "bow" ? <path d={`M 40 ${shoulderY - 30} Q 140 ${shoulderY + 90} 40 ${shoulderY + 210}`} stroke={look.weaponColor ?? "#8a5a1c"} strokeWidth={10} fill="none" /> : null}
      {/* legs */}
      {a.sit && pose === "meditating" ? (
        <ellipse cx={0} cy={-45} rx={150} ry={50} fill={look.garment} />
      ) : (
        [[-1, a.legL], [1, a.legR]].map(([side, ang]) => (
          <g key={side} transform={`translate(${side * 38} ${hipY}) rotate(${ang})`}>
            <rect x={-22} y={0} width={44} height={legLen + 20} rx={20} fill={look.skin} />
            <ellipse cx={side * 10} cy={legLen + 22} rx={34} ry={16} fill={look.skin} />
          </g>
        ))
      )}
      {/* garment */}
      {look.robe ? (
        <path d={`M -95 ${shoulderY + 20} L 95 ${shoulderY + 20} L ${a.sit ? 150 : 120} ${a.sit ? -30 : -40} L ${a.sit ? -150 : -120} ${a.sit ? -30 : -40} Z`} fill={look.garment} />
      ) : (
        <path d={`M -80 ${hipY - 30} L 80 ${hipY - 30} L ${a.sit ? 130 : 95} ${hipY + (a.sit ? 60 : 110)} L ${a.sit ? -130 : -95} ${hipY + (a.sit ? 60 : 110)} Z`} fill={look.garment} />
      )}
      <rect x={-82} y={hipY - 34} width={164} height={18} rx={8} fill={trim} />
      {/* torso */}
      {!look.robe ? <rect x={-80} y={shoulderY} width={160} height={hipY - shoulderY - 20} rx={60} fill={top} stroke="rgba(0,0,0,0.22)" strokeWidth={4} /> : null}
      <path d={`M -55 ${shoulderY + 30} Q 0 ${shoulderY + 95} 55 ${shoulderY + 30}`} stroke={jewel} strokeWidth={10} fill="none" />
      {/* arms */}
      {praying ? (
        <g>
          {[-1, 1].map((sd) => (
            <g key={sd}>
              <path d={`M ${sd * 78} ${shoulderY + 25} Q ${sd * 40} ${shoulderY + 140} ${sd * 8} ${shoulderY + 95}`} stroke="rgba(0,0,0,0.3)" strokeWidth={42} strokeLinecap="round" fill="none" />
              <path d={`M ${sd * 78} ${shoulderY + 25} Q ${sd * 40} ${shoulderY + 140} ${sd * 8} ${shoulderY + 95}`} stroke={look.skin} strokeWidth={34} strokeLinecap="round" fill="none" />
            </g>
          ))}
          <path d={`M 0 ${shoulderY + 40} l -14 60 h 28 z`} fill={look.skin} />
        </g>
      ) : (
        <g>{arm(-1, a.armL)}{arm(1, a.armR, rightHand)}</g>
      )}
      {/* head */}
      <g transform={`translate(0 ${shoulderY - 95})`}>
        <rect x={-22} y={50} width={44} height={50} fill={look.skin} />
        <circle r={95} fill={look.skin} />
        {look.hair ? <path d="M -95 -10 Q -90 -100 0 -105 Q 90 -100 95 -10 Q 60 -60 0 -62 Q -60 -60 -95 -10Z" fill={look.hair} /> : null}
        {look.beard ? <path d="M -70 30 Q -60 150 0 160 Q 60 150 70 30 Q 40 70 0 70 Q -40 70 -70 30Z" fill={look.beard} /> : null}
        <ellipse cx={-32} cy={-5} rx={11} ry={14 * blink} fill="#1d1d2b" />
        <ellipse cx={32} cy={-5} rx={11} ry={14 * blink} fill="#1d1d2b" />
        <path d="M -12 12 Q 0 22 12 12" stroke="#00000033" strokeWidth={5} fill="none" />
        <path d="M -26 42 Q 0 62 26 42" stroke="#7a2e2e" strokeWidth={7} fill="none" strokeLinecap="round" />
        <rect x={-5} y={-62} width={10} height={22} rx={5} fill="#d9342b" />
        {look.crown ? (
          <g>
            <path d="M -78 -60 L -60 -150 L -30 -100 L 0 -175 L 30 -100 L 60 -150 L 78 -60 Z" fill={look.crown} />
            <rect x={-82} y={-72} width={164} height={22} rx={10} fill={look.crown} />
            <circle cx={0} cy={-115} r={12} fill="#d9342b" />
          </g>
        ) : null}
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
      <ellipse cx={0} cy={4} rx={110} ry={18} fill="#000" opacity={a.lift > 15 || pose === "flying" || pose === "carrying" ? 0 : 0.18} />
      {a.lie ? <g transform={`translate(0 -60) rotate(-90 0 ${hipY / 2})`}>{body}</g> : body}
    </g>
  );
};
