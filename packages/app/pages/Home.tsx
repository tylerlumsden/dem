import { Alert } from "@mui/lab"
import React from "react"
import { isChrome } from "react-device-detect"
import { useNavigate } from "react-router"

import { HeaderSlot } from "../components/layout"
import { Match } from "../demo/Match"
import { openDemo, pickDir, fileTypeFilter } from "../io"

export const Home: React.VFC = () => {
  const [match, setMatch] = React.useState<Match | null>(null)
  const [output, setOutput] = React.useState<string[]>([])
  const [files, setFiles] = React.useState<File[]>([])
  const navigate = useNavigate()
  return match ? (
    <Match match={match} />
  ) : (
    <main>
      <HeaderSlot>
        <h1>CSGO Demo Viewer</h1>
      </HeaderSlot>
      {isChrome || (
        <Alert color="warning">Only Google Chrome is supported!</Alert>
      )}
      <p>Click the button below and select a DEM file.</p>
      <button onClick={() => navigate("/sample")}>Open a sample File</button>
      <button onClick={() => pickDir().then(setFiles)}>Open a Directory</button>
      <input
        type="file"
        accept=".dem,.json"
        disabled={output.length > 0}
        onChange={(e) =>
          [...(e.currentTarget.files || [])]
            .slice(0, 1)
            .map((file) => openDemo(file, setOutput, setMatch).then(setMatch))
        }
      />
      {output.length > 0 && (
        <pre>
          <p>Wait patiently. May take up to few minutes.</p>
          {output.join("\n")}
        </pre>
      )}
      {files.length > 0 && output.length < 1 && (
        <ul>
          {files.filter(fileTypeFilter).map((file) => (
            <li
              key={file.name}
              onClick={() => openDemo(file, setOutput, setMatch).then(setMatch)}
            >
              {file.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
