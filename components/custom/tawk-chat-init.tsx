import Script from "next/script";

const DEFAULT_TAWK_SRC = "https://embed.tawk.to/69ae1dbc8c729a1c3491ba77/1jj828a7p";

export function TawkChatInit() {
  const tawkSrc = process.env.NEXT_PUBLIC_TAWK_TO_SRC?.trim() || DEFAULT_TAWK_SRC;
  if (!tawkSrc) {
    return null;
  }

  return (
    <Script id="tawk-chat-init" strategy="afterInteractive">
      {`
        var Tawk_API = window.Tawk_API || {};
        var Tawk_LoadStart = new Date();
        document.documentElement.classList.add("has-tawk-chat");
        if (document.body) {
          document.body.classList.add("has-tawk-chat");
        }
        (function() {
          var s1 = document.createElement("script");
          var s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = "${tawkSrc}";
          s1.charset = "UTF-8";
          s1.setAttribute("crossorigin", "*");
          if (s0 && s0.parentNode) {
            s0.parentNode.insertBefore(s1, s0);
          } else {
            document.head.appendChild(s1);
          }
        })();
      `}
    </Script>
  );
}
