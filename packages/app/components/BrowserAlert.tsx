import { Alert } from "@mui/material"
import React from "react"
import {
  isChrome,
  isChromium,
  isFirefox,
  isMobileSafari,
  isSafari,
} from "react-device-detect"

export const BrowserAlert: React.FC = () => {
  return (
    <>
      {isChrome || isChromium || (
        <Alert color="error">
          Only Chrome based browsers are supported!
          {(isSafari || isMobileSafari || isFirefox) && (
            <p>
              Most things should work in Safari, Firefox but not well tested.
            </p>
          )}
        </Alert>
      )}
    </>
  )
}
