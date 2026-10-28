from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils import timezone


class Company(models.Model):
    SIZE_CHOICES = [
        ("1-10", "1-10 people"),
        ("11-50", "11-50 people"),
        ("51-200", "51-200 people"),
        ("201-1000", "201-1000 people"),
        ("1000+", "More than 1000 people"),
    ]

    name = models.CharField(max_length=200)
    industry = models.CharField(max_length=80)
    city = models.CharField(max_length=100)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES)

    class Meta:
        ordering = ["name", "id"]
        verbose_name_plural = "companies"
        indexes = [
            models.Index(fields=["name", "id"], name="company_name_idx"),
            models.Index(fields=["industry", "name"], name="company_industry_idx"),
        ]

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse("company_detail", args=[self.pk])


class Contact(models.Model):
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    title = models.CharField(max_length=120, blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="contacts")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_contacts",
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ["last_name", "first_name", "id"]
        indexes = [
            models.Index(fields=["last_name", "first_name", "id"], name="contact_name_idx"),
            models.Index(fields=["email"], name="contact_email_idx"),
            models.Index(fields=["company", "last_name"], name="contact_company_name_idx"),
            models.Index(fields=["owner", "last_name"], name="contact_owner_name_idx"),
            models.Index(fields=["-created_at"], name="contact_created_idx"),
        ]

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_absolute_url(self):
        return reverse("contact_detail", args=[self.pk])


class Activity(models.Model):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    KIND_CHOICES = [
        (CALL, "Call"),
        (EMAIL, "Email"),
        (MEETING, "Meeting"),
        (NOTE, "Note"),
    ]

    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="activities")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    subject = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    happened_at = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
    )

    class Meta:
        ordering = ["-happened_at", "-id"]
        verbose_name_plural = "activities"
        indexes = [
            models.Index(fields=["contact", "-happened_at"], name="activity_contact_time_idx"),
            models.Index(fields=["-happened_at", "-id"], name="activity_time_idx"),
            models.Index(fields=["user", "-happened_at"], name="activity_user_time_idx"),
        ]

    def __str__(self):
        return f"{self.get_kind_display()}: {self.subject}"
