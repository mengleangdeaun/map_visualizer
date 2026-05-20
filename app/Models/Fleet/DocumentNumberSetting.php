<?php

namespace App\Models\Fleet;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentNumberSetting extends Model
{
    use HasFactory, HasUlids, HasAuditFields;

    protected $table = 'document_number_settings';

    protected $fillable = [
        'company_id',
        'name',
        'prefix',
        'suffix',
        'date_format',
        'separator',
        'digit_padding',
        'next_number',
        'reset_frequency',
        'sequence_scope',
        'template',
        'is_active',
        'last_reset_at',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'digit_padding' => 'integer',
        'next_number' => 'integer',
        'is_active' => 'boolean',
        'last_reset_at' => 'datetime',
    ];

    /**
     * Get the company that owns the document numbering setting.
     */
    public function company()
    {
        return $this->belongsTo(\App\Models\System\Company::class);
    }
}
