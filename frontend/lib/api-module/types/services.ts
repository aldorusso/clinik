/**
 * Service types
 */

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service_count?: number;
}

export interface ServiceCategoryCreate {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ServiceCategoryUpdate {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface Service {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  short_description?: string;
  description?: string;

  // Prices
  price_min?: number;
  price_max?: number;
  price_consultation?: number;

  // Duration and sessions
  duration_minutes?: number;
  session_count_min?: number;
  session_count_max?: number;

  // Service configuration
  requires_consultation: boolean;
  requires_preparation: boolean;
  has_contraindications: boolean;

  // Medical info
  preparation_instructions?: string;
  aftercare_instructions?: string;
  contraindications?: string;
  side_effects?: string;

  // Scheduling configuration
  booking_buffer_before: number;
  booking_buffer_after: number;
  max_daily_bookings?: number;

  // Marketing targeting
  target_age_min?: number;
  target_age_max?: number;
  target_gender?: 'masculino' | 'femenino' | 'ambos';

  // SEO and marketing
  tags?: string[];
  meta_title?: string;
  meta_description?: string;

  // Images and multimedia
  featured_image?: string;
  gallery_images?: string[];
  video_url?: string;

  // State and configuration
  is_active: boolean;
  is_featured: boolean;
  is_online_bookable: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;

  // Related info
  category_name: string;

  // Computed fields
  price_range_text: string;
  session_count_text: string;

  // Optional stats
  lead_count?: number;
  appointment_count?: number;
  treatment_count?: number;
}

export interface ServiceCreate {
  category_id: string;
  name: string;
  short_description?: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  price_consultation?: number;
  duration_minutes?: number;
  session_count_min?: number;
  session_count_max?: number;
  requires_consultation?: boolean;
  requires_preparation?: boolean;
  has_contraindications?: boolean;
  preparation_instructions?: string;
  aftercare_instructions?: string;
  contraindications?: string;
  side_effects?: string;
  booking_buffer_before?: number;
  booking_buffer_after?: number;
  max_daily_bookings?: number;
  target_age_min?: number;
  target_age_max?: number;
  target_gender?: 'masculino' | 'femenino' | 'ambos';
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  gallery_images?: string[];
  video_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_online_bookable?: boolean;
  display_order?: number;
}

export interface ServiceUpdate {
  category_id?: string;
  name?: string;
  short_description?: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  price_consultation?: number;
  duration_minutes?: number;
  session_count_min?: number;
  session_count_max?: number;
  requires_consultation?: boolean;
  requires_preparation?: boolean;
  has_contraindications?: boolean;
  preparation_instructions?: string;
  aftercare_instructions?: string;
  contraindications?: string;
  side_effects?: string;
  booking_buffer_before?: number;
  booking_buffer_after?: number;
  max_daily_bookings?: number;
  target_age_min?: number;
  target_age_max?: number;
  target_gender?: 'masculino' | 'femenino' | 'ambos';
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  gallery_images?: string[];
  video_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_online_bookable?: boolean;
  display_order?: number;
}
