export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at?: string;
}

export interface AdminCourseMetrics {
  totalStudentsWithProgress: number;
  averageProgressPercentage: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  lessons: Lesson[];
  totalLessons: number;
  completedLessons?: number;
  progressPercentage?: number;
  metrics?: AdminCourseMetrics;
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  title?: string;
  startDate?: string;
  endDate?: string;
  minProgress?: number | null;
  maxProgress?: number | null;
  published?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  is_published: boolean;
}

export interface CreateLessonPayload {
  course_id: string;
  title: string;
  content: string;
  order_index: number;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  updated_at?: string;
}

export interface RecordProgressPayload {
  course_id: string;
  lesson_id: string;
  completed: boolean;
}
