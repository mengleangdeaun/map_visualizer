<?php

namespace App\Traits;

use App\Models\User\User;

trait HasAuditFields
{
    /**
     * Boot the trait to add automatic auditing hooks.
     */
    public static function bootHasAuditFields()
    {
        static::creating(function ($model) {
            if (auth()->check()) {
                if (empty($model->created_by)) {
                    $model->created_by = auth()->id();
                }
                if (empty($model->updated_by)) {
                    $model->updated_by = auth()->id();
                }
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });
    }

    /**
     * Get the user who created this record.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this record.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
