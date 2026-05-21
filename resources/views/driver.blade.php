<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Driver PWA</title>

    <link rel="shortcut icon" href="{{ asset('favicon.svg') }}">

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
