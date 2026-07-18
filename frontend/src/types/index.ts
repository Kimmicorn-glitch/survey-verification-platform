/**
 * Survey Verification Platform - Core Type Definitions
 * BackOffice Pro
 */

/* ============================================
   Identity & Authentication Types
   ============================================ */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  walletAddress?: string;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type UserRole = "super_admin" | "admin" | "manager" | "verifier" | "surveyor" | "viewer";

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "approve" | "export";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
}

/* ============================================
   Survey Types
   ============================================ */

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  createdBy: string;
  organizationId: string;
  questions: Question[];
  settings: SurveySettings;
  responseCount: number;
  completionRate: number;
  verificationStatus: VerificationStatus;
  nftTokenId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
}

export type SurveyStatus = "draft" | "active" | "paused" | "closed" | "archived";
export type VerificationStatus = "pending" | "verifying" | "verified" | "rejected" | "disputed";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: QuestionValidation;
  order: number;
}

export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "datetime"
  | "select"
  | "multi_select"
  | "radio"
  | "checkbox"
  | "rating"
  | "scale"
  | "file_upload"
  | "location"
  | "signature";

export interface QuestionValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface SurveySettings {
  allowAnonymous: boolean;
  requireAuthentication: boolean;
  enableGeolocation: boolean;
  enableBlockchainVerification: boolean;
  maxResponses?: number;
  expiresAt?: string;
  redirectUrl?: string;
  notificationEmails: string[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  answers: Answer[];
  metadata: ResponseMetadata;
  verificationHash?: string;
  geoHash?: string;
  trustScore?: number;
  createdAt: string;
}

export interface Answer {
  questionId: string;
  value: string | string[] | number | boolean | FileUploadValue;
}

export interface FileUploadValue {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface ResponseMetadata {
  userAgent: string;
  ipAddress: string;
  geolocation?: GeoLocation;
  duration: number;
  completedAt: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  geohash: string;
}

/* ============================================
   Verification Types
   ============================================ */

export interface Verification {
  id: string;
  surveyResponseId: string;
  status: VerificationStatus;
  trustScore: number;
  confidence: number;
  verificationHash: string;
  blockchainTxHash?: string;
  nftTokenId?: string;
  fraudIndicators: FraudIndicator[];
  aiAnalysis: AIAnalysis;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FraudIndicator {
  type: FraudType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  confidence: number;
}

export type FraudType =
  | "duplicate_response"
  | "suspicious_timing"
  | "geolocation_mismatch"
  | "ip_anomaly"
  | "pattern_anomaly"
  | "bot_detection"
  | "identity_mismatch"
  | "device_fingerprint";

export interface AIAnalysis {
  behaviourScore: number;
  geoScore: number;
  patternScore: number;
  identityScore: number;
  overallScore: number;
  recommendations: string[];
  processingTimeMs: number;
  modelVersion: string;
}

/* ============================================
   NFT Types
   ============================================ */

export interface NFTCertificate {
  id: string;
  tokenId: string;
  contractAddress: string;
  surveyId: string;
  verificationId: string;
  ownerAddress: string;
  metadata: NFTMetadata;
  verificationHash: string;
  geoHash: string;
  trustScore: number;
  mintedAt: string;
  chainId: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

/* ============================================
   Wallet Types
   ============================================ */

export interface Wallet {
  id: string;
  address: string;
  chainId: number;
  userId: string;
  label?: string;
  isPrimary: boolean;
  balance: string;
  connectedAt: string;
}

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  status: "pending" | "confirmed" | "failed";
  type: "mint" | "transfer" | "approval" | "payment";
  chainId: number;
  createdAt: string;
  confirmedAt?: string;
}

/* ============================================
   Payment Types
   ============================================ */

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: "active" | "past_due" | "canceled" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
}

export type SubscriptionPlan = "free" | "starter" | "professional" | "enterprise";

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  dueDate: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
  quantity: number;
}

/* ============================================
   Dashboard Types
   ============================================ */

export interface DashboardStats {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  verifiedResponses: number;
  averageTrustScore: number;
  fraudDetected: number;
  nftsMinted: number;
  pendingVerifications: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/* ============================================
   API Response Types
   ============================================ */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

/* ============================================
    Notification Types
   ============================================ */

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

/* ============================================
    Report Types
   ============================================ */

export interface Report {
  id: string;
  title: string;
  type: string;
  surveyId?: string;
  format: "csv" | "json" | "pdf";
  status: "generating" | "ready" | "failed";
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
}
