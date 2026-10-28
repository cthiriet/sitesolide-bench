from django import forms
from django.contrib.auth import get_user_model

from .models import Activity, Company, Contact


class ContactForm(forms.ModelForm):
    class Meta:
        model = Contact
        fields = ["first_name", "last_name", "email", "phone", "title", "company", "owner"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["company"].queryset = Company.objects.only("name").order_by("name", "id")
        self.fields["owner"].queryset = get_user_model().objects.order_by("username")
        self.fields["owner"].label_from_instance = lambda user: user.get_username()


class ActivityForm(forms.ModelForm):
    class Meta:
        model = Activity
        fields = ["kind", "subject", "body"]
        widgets = {"body": forms.Textarea(attrs={"rows": 4})}
