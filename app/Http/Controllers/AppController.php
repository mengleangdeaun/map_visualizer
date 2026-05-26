<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;

class AppController extends Controller
{
    public function adminIndex()
    {
        return view('app');
    }

    public function driverIndex()
    {
        return view('driver');
    }

    public function systemIndex()
    {
        return view('system');
    }
}
