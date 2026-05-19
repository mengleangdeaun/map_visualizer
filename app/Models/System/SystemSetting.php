<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    /**
     * Get setting value by key helper, casted to its designated type.
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        switch ($setting->type) {
            case 'float':
            case 'double':
                return (float) $setting->value;
            case 'integer':
            case 'int':
                return (int) $setting->value;
            case 'boolean':
            case 'bool':
                return filter_var($setting->value, FILTER_VALIDATE_BOOLEAN);
            default:
                return $setting->value;
        }
    }

    /**
     * Set setting value by key helper.
     */
    public static function setValue(string $key, $value, string $type = 'string'): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value === null ? null : (string) $value,
                'type' => $type,
            ]
        );
    }
}
