<?php

namespace App\Models\User;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUlids;

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = ['profile_full_url'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'role',
        'name',
        'phone',
        'email',
        'telegram_user_id',
        'password',
        'base_hub_id',
        'status',
        'operational_status',
        'profile_url',
        'permissions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'permissions' => 'json',
    ];

    /**
     * Get the full URL for the profile picture.
     */
    protected function profileFullUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->profile_url ? (filter_var($this->profile_url, FILTER_VALIDATE_URL) ? $this->profile_url : Storage::disk('public')->url($this->profile_url)) : null,
        );
    }

    /**
     * Get the company that the user belongs to.
     */
    public function company()
    {
        return $this->belongsTo(\App\Models\System\Company::class);
    }

    /**
     * Get the hub that the user is assigned to.
     */
    public function hub()
    {
        return $this->belongsTo(\App\Models\Fleet\Location::class, 'base_hub_id');
    }
}
