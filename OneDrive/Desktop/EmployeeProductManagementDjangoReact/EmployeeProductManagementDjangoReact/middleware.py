from django.http import JsonResponse

class RoleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            user = request.user
            if user.is_authenticated:
                # Check user type and permissions
                if hasattr(user, 'employer_profile'):
                    request.user_type = 'employer'
                elif hasattr(user, 'employee_profile'):
                    request.user_type = 'employee'
                else:
                    return JsonResponse({'error': 'Invalid user type'}, status=403)
            
        response = self.get_response(request)
        return response