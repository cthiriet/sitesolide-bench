from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

urlpatterns = [
    path("health", views.health, name="health"),
    path("login/", auth_views.LoginView.as_view(template_name="contacts/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("", views.home, name="home"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("contacts/", views.contact_list, name="contact_list"),
    path("contacts/new/", views.contact_edit, name="contact_new"),
    path("contacts/<int:pk>/", views.contact_detail, name="contact_detail"),
    path("contacts/<int:pk>/edit/", views.contact_edit, name="contact_edit"),
    path("contacts/<int:pk>/activities/new/", views.activity_new, name="activity_new"),
    path("companies/", views.company_list, name="company_list"),
    path("companies/<int:pk>/", views.company_detail, name="company_detail"),
    path("export/contacts.csv", views.export_contacts, name="export_contacts"),
]
