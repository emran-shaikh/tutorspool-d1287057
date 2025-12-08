import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageSquare,
  HelpCircle,
  Users
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@tutorspool.com",
    description: "We'll respond within 24 hours"
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri, 9am-6pm EST"
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "123 Education Lane",
    description: "San Francisco, CA 94102"
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "Mon - Fri: 9am - 6pm",
    description: "Weekend support available"
  }
];

const faqs = [
  {
    question: "How do I find a tutor?",
    answer: "Browse our tutor directory, filter by subject or expertise, view profiles, and book a session directly through our platform."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers. Payment is processed securely through our platform."
  },
  {
    question: "Can I become a tutor?",
    answer: "Yes! If you have expertise in a subject and passion for teaching, apply through our 'Become a Tutor' page. We'll review your application within 48 hours."
  },
  {
    question: "How do online sessions work?",
    answer: "Sessions are conducted via Zoom video conferencing. Once a tutor accepts your booking, you'll receive a meeting link to join at the scheduled time."
  }
];

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours."
    });
    
    setFormData({ name: "", email: "", subject: "", message: "" });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container text-center">
            <Badge variant="outline" className="mb-4">
              <MessageSquare className="h-3 w-3 mr-1" />
              Get In Touch
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Contact <span className="text-primary">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or need help? We're here for you. Reach out and 
              our team will get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 border-b">
          <div className="container">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info) => (
                <Card key={info.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{info.title}</h3>
                    <p className="text-primary">{info.value}</p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & FAQ */}
        <section className="py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Send Us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you shortly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="What's this about?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <h3 className="font-medium mb-2">{faq.question}</h3>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card className="mt-6 bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 text-center">
                    <Users className="h-8 w-8 mx-auto text-primary mb-3" />
                    <h3 className="font-medium mb-2">Need More Help?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Our support team is available 24/7 to assist you
                    </p>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Live Chat
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
