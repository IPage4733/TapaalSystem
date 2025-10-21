import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Phone,
  Mail,
  MapPin,
  AlertCircle
} from 'lucide-react';

const UserPortalHome: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    {
      title: 'Submit New Petition',
      description: 'Submit your grievances, requests, or suggestions to the appropriate department',
      icon: FileText,
      path: '/user-portal/submit',
      color: 'blue',
      primary: true
    },
    {
      title: 'Track Petition Status',
      description: 'Check the current status and progress of your submitted petition',
      icon: Search,
      path: '/user-portal/track',
      color: 'green'
    }
  ];

  const features = [
    {
      icon: CheckCircle,
      title: 'Easy Submission',
      description: 'Simple form to submit your petition with file attachments'
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Track your petition status and officer assignments in real-time'
    },
    {
      icon: Users,
      title: 'Direct Assignment',
      description: 'Petitions are automatically routed to the appropriate department'
    },
    {
      icon: Shield,
      title: 'Secure & Confidential',
      description: 'Your personal information and petition details are kept secure'
    }
  ];

  const stats = [
    { label: 'Petitions Processed', value: '2,847', color: 'blue' },
    { label: 'Average Resolution Time', value: '12 days', color: 'green' },
    { label: 'Citizen Satisfaction', value: '94%', color: 'purple' },
    { label: 'Active Departments', value: '8', color: 'orange' }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Citizen Services Portal
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Submit your petitions, track their progress, and stay connected with your district administration. 
          We're here to serve you with transparency and efficiency.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/user-portal/submit')}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <FileText className="h-6 w-6 mr-3" />
            Submit New Petition
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
          <button
            onClick={() => navigate('/user-portal/track')}
            className="inline-flex items-center px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-lg font-medium"
          >
            <Search className="h-6 w-6 mr-3" />
            Track Petition Status
          </button>
        </div>
      </div>

      {/* Services Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.path}
              className={`bg-white rounded-xl shadow-lg p-8 border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                service.primary 
                  ? 'border-blue-200 hover:border-blue-300' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => navigate(service.path)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-lg ${
                  service.primary 
                    ? 'bg-blue-100' 
                    : `bg-${service.color}-100`
                }`}>
                  <Icon className={`h-8 w-8 ${
                    service.primary 
                      ? 'text-blue-600' 
                      : `text-${service.color}-600`
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="flex items-center text-blue-600 font-medium">
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-3xl font-bold text-${stat.color}-600 mb-2`}>
                {stat.value}
              </div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose Our Portal?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Important Information</h3>
            <div className="text-yellow-700 space-y-1 text-sm">
              <p>• All petitions are processed within 30 days as per government guidelines</p>
              <p>• You will receive SMS/Email notifications for status updates</p>
              <p>• For urgent matters, please contact the helpline: 1800-XXX-XXXX</p>
              <p>• Keep your Petition ID safe for future reference and tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-800 text-white rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Phone className="h-8 w-8 text-blue-400" />
            <h3 className="font-semibold">Call Us</h3>
            <p className="text-gray-300">1800-XXX-XXXX</p>
            <p className="text-sm text-gray-400">Mon-Fri, 9 AM - 6 PM</p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Mail className="h-8 w-8 text-green-400" />
            <h3 className="font-semibold">Email Us</h3>
            <p className="text-gray-300">help@district.gov.in</p>
            <p className="text-sm text-gray-400">Response within 24 hours</p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <MapPin className="h-8 w-8 text-red-400" />
            <h3 className="font-semibold">Visit Us</h3>
            <p className="text-gray-300">District Collectorate</p>
            <p className="text-sm text-gray-400">Mon-Fri, 10 AM - 5 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPortalHome;