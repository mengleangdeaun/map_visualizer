<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>SCCG</title>

    <link rel="shortcut icon" href="{{ asset('favicon.svg') }}">

    <!-- PWA Settings & Icons -->
    <link rel="manifest" href="/build/manifest.webmanifest">
    <meta name="theme-color" content="#0a0a0a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="SCCG Driver">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/build/sw.js')
                    .then(reg => console.log('PWA Service Worker registered successfully', reg))
                    .catch(err => console.error('PWA Service Worker registration failed', err));
            });
        }
    </script>

    <style>
        html, body {
            background-color: #0a0a0a !important;
            color: #ffffff;
            margin: 0;
            padding: 0;
            height: 100%;
        }
    </style>

    @viteReactRefresh
    @vite(['resources/js/src/driver.tsx'])
</head>

<body>
    <noscript>
        <strong>We're sorry but Driver PWA doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>

    <div id="root"></div>
</body>

</html>
