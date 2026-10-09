import { useState } from "react";
import { Crown, TrendingUp, Globe2, Gem, Landmark, Leaf } from "lucide-react";
import type { PawnId } from "@global-fund/shared";
const pawnIcons = {lion:Crown,bull:TrendingUp,globe:Globe2,crystal:Gem,tower:Landmark,leaf:Leaf};
export default function Pawn({ id, color }: { id: PawnId; color?: string }) {
  const Icon = pawnIcons[id] ?? Globe2;
  const [failed, setFailed] = useState(false);
  return (
    <span className={`pawn-object pawn-${id}`} style={{ color }}>
      {!failed && (
        <img
          src={`/assets/pawns/premium/${id}.webp`}
          alt=""
          onError={() => setFailed(true)}
        />
      )}
      <Icon aria-hidden="true" className={failed ? "" : "pawn-fallback"} />
    </span>
  );
}
