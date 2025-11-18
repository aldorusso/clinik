export enum EmailTemplateType {
  PASSWORD_RESET = "password_reset",
  WELCOME = "welcome",
  NOTIFICATION = "notification",
}

export interface EmailTemplate {
  id: string;
  name: string;
  template_type: EmailTemplateType;
  subject: string;
  html_content: string;
  variables: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateCreate {
  name: string;
  template_type: EmailTemplateType;
  subject: string;
  html_content: string;
  variables?: string;
  is_active?: boolean;
}

export interface EmailTemplateUpdate {
  name?: string;
  subject?: string;
  html_content?: string;
  variables?: string;
  is_active?: boolean;
}

export interface EmailTemplatePreview {
  subject: string;
  html_content: string;
  sample_data: Record<string, any>;
}
