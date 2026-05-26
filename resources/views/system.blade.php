<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>SCCG System Administration</title>

    <link rel="shortcut icon" href="{{ asset('favicon.svg') }}">

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
    @vite(['resources/js/src/system.tsx'])
</head>

<body>
    <noscript>
        <strong>We're sorry but SCCG System Administration doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>

    <div id="root"></div>
</body>

</html>
