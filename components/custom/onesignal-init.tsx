"use client";

import Script from "next/script";

const ONESIGNAL_APP_ID = "3357e0a5-581a-46de-a086-0e22fd9f8c8a";

export function OneSignalInit() {
  return (
    <>
      <Script
        id="onesignal-sdk"
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      <Script id="onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "${ONESIGNAL_APP_ID}"
            });
          });
        `}
      </Script>
    </>
  );
}
