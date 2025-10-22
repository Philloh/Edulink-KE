import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Phone, School, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import TeacherSignupForm from '../components/TeacherSignupForm'
import toast from 'react-hot-toast'

function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const { register: registerUser } = useAuth()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const handleRoleSelection = (role) => {
    setSelectedRole(role)
  }

  const handleTeacherSuccess = (user) => {
    // Teacher registration completed successfully
    toast.success('Teacher registration completed! Please sign in to continue.')
    navigate('/login')
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      // Transform data to match backend requirements
      const registrationData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        role: data.role,
        schoolId: data.school, // Using school name as schoolId for now
        phone: data.phone || undefined,
        class: data.class || undefined,
        studentId: data.studentId || undefined
      }
      
      const result = await registerUser(registrationData)
      if (result.success) {
        toast.success('Registration successful!')
        // Redirect based on role
        if (data.role === 'parent') navigate('/parent-dashboard')
        else if (data.role === 'student') navigate('/student-dashboard')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">EK</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
          <p className="mt-1 text-center text-sm text-gray-500">
            Need to register a school?{' '}
            <Link
              to="/school-registration"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Register School
            </Link>
          </p>
        </div>
        
        {!selectedRole ? (
          /* Role Selection */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'parent', label: 'Parent', icon: User },
                  { value: 'teacher', label: 'Teacher', icon: GraduationCap },
                  { value: 'student', label: 'Student', icon: School }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRoleSelection(value)}
                    className="flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-colors border-gray-300 hover:border-gray-400"
                  >
                    <Icon className="h-6 w-6 mb-1" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : selectedRole === 'teacher' ? (
          /* Teacher Signup Form */
          <div>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ← Back to role selection
              </button>
            </div>
            <TeacherSignupForm onSuccess={handleTeacherSuccess} />
          </div>
        ) : (
          /* Parent/Student Registration Form */
          <div>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ← Back to role selection
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" {...register('role')} value={selectedRole} />
              <div className="space-y-4">

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      type="text"
                      className="input-field mt-1"
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      type="text"
                      className="input-field mt-1"
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="input-field pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="input-field pl-10"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* School */}
                <div>
                  <label htmlFor="school" className="block text-sm font-medium text-gray-700">
                    School Name
                  </label>
                  <input
                    {...register('school', { required: 'School name is required' })}
                    type="text"
                    className="input-field mt-1"
                    placeholder="Enter school name"
                  />
                  {errors.school && (
                    <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
                  )}
                </div>

                {/* Class (for students) */}
                {selectedRole === 'student' && (
                  <div>
                    <label htmlFor="class" className="block text-sm font-medium text-gray-700">
                      Class
                    </label>
                    <input
                      {...register('class', { required: 'Class is required' })}
                      type="text"
                      className="input-field mt-1"
                      placeholder="e.g., Grade 5, Class 3A"
                    />
                    {errors.class && (
                      <p className="mt-1 text-sm text-red-600">{errors.class.message}</p>
                    )}
                  </div>
                )}

                {/* Student ID (for students) */}
                {selectedRole === 'student' && (
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                      Student ID
                    </label>
                    <input
                      {...register('studentId')}
                      type="text"
                      className="input-field mt-1"
                      placeholder="Enter student ID"
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pl-10 pr-10"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register
