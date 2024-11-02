import React from "react"
import { isSafari } from "react-device-detect"

import {
  NadeColor,
  bombColor,
  colorToMatrix,
  findKillEvent,
  icon,
  pointToTuple,
  pointsToString,
  rotatePoint,
  smoke2dRadius,
  teamColor,
  vectorToPoint,
  frameToTime
} from "."
import { useMatch } from "../hooks/useMatch"

export const FrameView: React.FC = () => {
  const frame = useMatch((state) => state.frame)

  const {round, match} = useMatch()

  let playersCT = Array()
  let playersT = Array()

  frame?.Players.forEach((player) => {
    if(player.Team == 3) {
      playersCT.push(player)
    }
    if(player.Team == 2) {
      playersT.push(player)
    }
  })

  playersCT.sort(function(a, b) {
    return a.X - b.X
  })

  playersT.sort(function(a, b) {
    return a.X - b.X
  })
  const url = " http://127.0.0.1:8000/predict"

  const time = (match && round && frame && frameToTime(match, round, frame)) ?? 0

  const predictData = {
    CT_X1:playersCT[0].X,
    CT_X2:playersCT[1].X,
    CT_X3:playersCT[2].X,
    CT_X4:playersCT[3].X,
    CT_X5:playersCT[4].X,
    CT_Y1:playersCT[0].Y,
    CT_Y2:playersCT[1].Y,
    CT_Y3:playersCT[2].Y,
    CT_Y4:playersCT[3].Y,
    CT_Y5:playersCT[4].Y,

    T_X1:playersT[0].X,
    T_X2:playersT[1].X,
    T_X3:playersT[2].X,
    T_X4:playersT[3].X,
    T_X5:playersT[4].X,
    T_Y1:playersT[0].Y,
    T_Y2:playersT[1].Y,
    T_Y3:playersT[2].Y,
    T_Y4:playersT[3].Y,
    T_Y5:playersT[4].Y,

    AliveCT_1:(playersCT[0].Hp >= 1),
    AliveCT_2:(playersCT[1].Hp >= 1),
    AliveCT_3:(playersCT[2].Hp >= 1),
    AliveCT_4:(playersCT[3].Hp >= 1),
    AliveCT_5:(playersCT[4].Hp >= 1),

    AliveT_1:(playersT[0].Hp >= 1),
    AliveT_2:(playersT[1].Hp >= 1),
    AliveT_3:(playersT[2].Hp >= 1),
    AliveT_4:(playersT[3].Hp >= 1),
    AliveT_5:(playersT[4].Hp >= 1),

    TimeLeft:time
  }

  fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(predictData),
  }).then((response) =>  response.json().then((json => console.log(json))))

  return frame ? (
    <>
      <MolotovView frame={frame} />
      {(frame.Players || []).map((e) => (
        <FramePlayer key={e.ID} player={e} />
      ))}
      <BombView frame={frame} />
      {(frame.Nades || []).map((e) => (
        <NadeView key={e.ID} nade={e} />
      ))}
    </>
  ) : null
}

export const FramePlayer: React.FC<{ player: Player }> = ({ player }) => {
  const { X, Y } = vectorToPoint(player)
  const killedTick = useMatch(
    (state) => findKillEvent(state.match, state.round, player.ID)?.Tick,
  )
  const setTick = useMatch((state) => state.setTick)
  const onClick =
    !player.Hp && killedTick ? () => setTick(killedTick) : undefined
  return (
    <g onClick={onClick} cursor={onClick ? "pointer" : "default"}>
      <circle cx={X} cy={Y} r="8" fill="transparent" />
      {!player.Hp ? (
        <path
          d={[
            ...["M", X - 4, Y - 4, "L", X + 4, Y + 4],
            ...["M", X - 4, Y + 4, "L", X + 4, Y - 4],
          ].join(" ")}
          fill="transparent"
          stroke={teamColor(player.Team)}
          strokeWidth={2}
        />
      ) : (
        <>
          <circle cx={X} cy={Y} r="8" fill={teamColor(player.Team)} />
          <circle
            cx={X}
            cy={Y}
            r="12"
            fill="white"
            fillOpacity={player.Flashed ? 0.5 : 0}
          />
          <path
            d={[
              ...["M", ...pointToTuple(rotatePoint({ X, Y }, -player.Yaw, 2))],
              ...["L", ...pointToTuple(rotatePoint({ X, Y }, -player.Yaw, 12))],
            ].join(" ")}
            strokeWidth={2}
            stroke="#fff"
            fill="transparent"
          />
        </>
      )}
      <text
        x={X + 15}
        y={Y}
        fontSize="14"
        fill={player.Hp ? "#eee" : "#888"}
        fontFamily="monospace"
      >
        {player.Name}
      </text>
    </g>
  )
}

export const TrailView: React.FC = () => {
  const round = useMatch((state) => state.round)
  const frame = useMatch((state) => state.frame)
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const context = ref.current?.getContext?.("2d")
    if (context) {
      context.clearRect(0, 0, 1024, 1024)

      const index = frame ? round?.Frames.indexOf(frame) : 0
      const futureFrames = round?.Frames.slice(index)

      futureFrames?.forEach((e) => {
        for (const player of e.Players) {
          context.fillStyle = teamColor(player.Team)
          const { X, Y } = vectorToPoint(player)
          context.fillRect(X, Y, 1, 1)
        }
      })
    }
  }, [frame, round])
  if (isSafari) return // ref https://bugs.webkit.org/show_bug.cgi?id=23113
  return (
    <foreignObject x={0} y={0} width={1024} height={1024}>
      <canvas ref={ref} width="1024" height="1024" />
    </foreignObject>
  )
}

export const BombView: React.FC<{ frame: Frame }> = ({ frame }) => {
  const { X, Y } = vectorToPoint(frame.Bomb)
  return (
    <g>
      <image
        x={X - 8}
        y={Y - 13}
        href={icon("404")}
        width="15"
        height="25"
        filter="url(#BombColor)"
      />
      <filter id="BombColor">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values={colorToMatrix(bombColor(frame.Bomb.State))}
        />
      </filter>
    </g>
  )
}

export const MolotovView: React.FC<{ frame: Frame }> = ({ frame }) => {
  return (
    <g>
      {frame.Nades?.filter((e) => e.Flames?.length).map((nade) =>
        nade.Flames?.map((flame, i) => (
          <polygon
            key={i}
            points={pointsToString(flame)}
            stroke={teamColor(nade.Team)}
            strokeOpacity={0.75}
            strokeWidth="0.5"
            fill="#8e0c05"
            fillOpacity={0.25}
          />
        )),
      )}
    </g>
  )
}

export const NadeView: React.FC<{ nade: Nade }> = ({ nade }) => {
  const { X, Y } = vectorToPoint(nade)
  const r = useMatch((state) => smoke2dRadius(state.match))
  if (!nade.Weapon) return null
  return nade.Weapon === 505 && nade.Active ? (
    <circle
      cx={X}
      cy={Y}
      r={r}
      fill="#ccc"
      fillOpacity={0.25}
      stroke={teamColor(nade.Team)}
      strokeOpacity={0.5}
      strokeWidth="1"
    />
  ) : (
    <circle
      cx={X}
      cy={Y}
      r="5"
      fill={NadeColor[nade.Weapon]}
      stroke={teamColor(nade.Team)}
      strokeWidth="2"
    />
  )
}
