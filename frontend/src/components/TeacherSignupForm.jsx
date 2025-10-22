import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { 
  User, 
  School, 
  Hash, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { authAPI, schoolsAPI } from '../services/api'
import toast from 'react-hot-toast'

function TeacherSignupForm({ onSuccess }) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [schools, setSchools] = useState([])
  const [verificationData, setVerificationData] = useState(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  // Load schools on component mount
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const response = await schoolsAPI.getSchools()
        setSchools(response.data.data || [])
      } catch (error) {
        console.error('Failed to load schools:', error)
        toast.error('Failed to load schools. Please try again.')
      }
    }
    loadSchools()
  }, [])

  const onStep1Submit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authAPI.teacherVerify({
        name: `${data.firstName} ${data.lastName}`,
        schoolId: data.schoolId,
        tscNumber: data.tscNumber,
        email: data.email
      })
      
      setVerificationData(response.data.data)
      setStep(2)
      toast.success('Teacher verification successful!')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Verification failed'
      if (error.response?.data?.error === 'INVALID_SCHOOL') {
        toast.error('The selected school is not registered. Please register the school first.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onStep2Submit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authAPI.teacherComplete({
        verificationToken: verificationData.verificationToken,
        username: data.username,
        password: data.password,
        class: data.class || undefined,
        subjects: data.subjects || undefined,
        phone: data.phone || undefined
      })
      
      toast.success('Teacher registration completed!')
      onSuccess(response.data.user)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const subjectOptions = [
    'Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies',
    'Religious Education', 'Physical Education', 'Art', 'Music', 'Computer Studies',
    'Agriculture', 'Business Studies', 'History', 'Geography', 'Chemistry',
    'Physics', 'Biology', 'Literature', 'French', 'German'
  ]

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Verification</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Profile</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
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

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
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

          <div>
            <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700">
              School
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <School className="h-5 w-5 text-gray-400" />
              </div>
              <select
                {...register('schoolId', { required: 'School is required' })}
                className="input-field pl-10"
                disabled={schools.length === 0}
              >
                <option value="">
                  {schools.length === 0 ? 'No schools available' : 'Select your school'}
                </option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name} ({school.type}) - {school.location}
                  </option>
                ))}
              </select>
            </div>
            {schools.length === 0 && (
              <p className="mt-1 text-sm text-amber-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                No schools are registered yet. Please register a school first.
              </p>
            )}
            {errors.schoolId && (
              <p className="mt-1 text-sm text-red-600">{errors.schoolId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="tscNumber" className="block text-sm font-medium text-gray-700">
              TSC Number
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('tscNumber', { required: 'TSC number is required' })}
                type="text"
                className="input-field pl-10"
                placeholder="Enter your TSC number"
              />
            </div>
            {errors.tscNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.tscNumber.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || schools.length === 0}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Teacher Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            )}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onStep2Submit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              {...register('username', { required: 'Username is required' })}
              type="text"
              className="input-field mt-1"
              placeholder="Choose a username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
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

          {/* Optional fields omitted for simplicity; can be enabled later */}

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="input-field mt-1"
              placeholder="Enter your phone number"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Completing...
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Registration
              </div>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default TeacherSignupForm
