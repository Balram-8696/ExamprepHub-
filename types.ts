import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    createdAt: Timestamp;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: Timestamp;
    isActive: boolean;
}

export interface Category {
    id:string;
    name: string;
    parentId?: string | null;
    sections?: string[];
    icon?: string;
}

export interface Question {
    question: string;
    options: string[];
    correctAnswer: string; // 'A', 'B', 'C', 'D'
    explanation?: string;
}

export interface Test {
    id: string;
    title: string;
    categoryId: string;
    category: string;
    questionCount: number;
    durationMinutes: number;
    marksPerQuestion: number;
    negativeMarking: number;
    publishAt?: Timestamp;
    expiresAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    status: 'draft' | 'published';
    questions: Question[];
    section?: string;
}

export interface UserResult {
    id: string;
    userId: string;
    userEmail: string;
    testId: string;
    testTitle: string;
    categoryId: string;
    categoryName: string;
    score: number;
    total: number;
    correctCount: number;
    incorrectCount: number;
    percentage: number;
    submittedAt: Timestamp;
    userAnswers?: UserAnswer[];
}

export type AnswerStatus = 'unattempted' | 'answered' | 'marked' | 'answered_marked' | 'incorrect';

export interface UserAnswer {
    answer: string | null; // 'A', 'B', 'C', 'D'
    status: AnswerStatus;
}

export interface TestStateLocal {
    testId: string;
    currentQuestionIndex: number;
    userAnswers: UserAnswer[];
    timeRemaining: number;
}

export interface CustomPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published';
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface FooterLink {
    label: string;
    path: string; // For internal: 'home', 'about'. For custom: page slug
}

// --- New Homepage Layout Types ---

export interface BannerComponentConfig {
    title: string;
    subtitle: string;
    imageUrl: string | null;
}

export interface FeaturedCategoryComponentConfig {
    title: string;
    categoryId: string | null;
}

export interface LatestTestsComponentConfig {
    title: string;
    limit: number;
}

export interface RecentTestsComponentConfig {
    title: string;
    limit: number;
}

export interface CategoriesGridComponentConfig {
    title: string;
}

export interface RichTextComponentConfig {
    content: string;
}

export interface AnnouncementsComponentConfig {
    title: string;
}

export interface Testimonial {
    text: string;
    author: string;
    role: string;
}
export interface TestimonialsComponentConfig {
    title: string;
    testimonials: Testimonial[];
}

export interface Stat {
    label: string;
    value: string;
}
export interface StatsCounterComponentConfig {
    title: string;
    stats: Stat[];
}

export interface FAQ {
    question: string;
    answer: string;
}
export interface FAQComponentConfig {
    title: string;
    faqs: FAQ[];
}

export interface CTAComponentConfig {
    headline: string;
    description: string;
    buttonText: string;
    buttonLink: string;
}

export interface SyllabusComponentConfig {
    title: string;
    content: string; // HTML content
}

export interface NotesComponentConfig {
    title: string;
    content: string; // HTML content
}

export interface InformationComponentConfig {
    title: string;
    content: string; // HTML content
}

export interface NewAdditionsComponentConfig {
    title: string;
    limit: number;
}

export type HomeComponent = {
    id: string;
    type: 'banner' | 'featured_category' | 'latest_tests' | 'categories_grid' | 'rich_text' | 'recent_tests' | 'announcements' | 'testimonials' | 'stats_counter' | 'faq' | 'cta' | 'syllabus' | 'notes' | 'information' | 'new_additions';
    enabled: boolean;
    config: BannerComponentConfig | FeaturedCategoryComponentConfig | LatestTestsComponentConfig | CategoriesGridComponentConfig | RichTextComponentConfig | RecentTestsComponentConfig | AnnouncementsComponentConfig | TestimonialsComponentConfig | StatsCounterComponentConfig | FAQComponentConfig | CTAComponentConfig | SyllabusComponentConfig | NotesComponentConfig | InformationComponentConfig | NewAdditionsComponentConfig;
}

export interface HomepageSettings {
    layout: HomeComponent[];
}

export interface Report {
    id: string;
    testId: string;
    testTitle: string;
    questionIndex: number;
    questionText: string;
    reason: string;
    comments: string;
    userId: string;
    userEmail: string;
    userName: string;
    reportedAt: Timestamp;
    status: 'pending' | 'resolved' | 'discarded';
    adminReply?: string;
}