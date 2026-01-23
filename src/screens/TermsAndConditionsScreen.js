import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.introText}>
            Last Updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.sectionText}>
            Welcome to Nigerian Apartments. These Terms and Conditions ("Terms") govern your use of 
            our mobile application and services. By accessing or using Nigerian Apartments, you agree 
            to be bound by these Terms in accordance with the laws of the Federal Republic of Nigeria.
          </Text>
        </View>

        {/* 1. Definitions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Definitions</Text>
          <Text style={styles.subsectionTitle}>1.1. Key Terms</Text>
          <Text style={styles.sectionText}>
            • <Text style={styles.bold}>"Platform"</Text> refers to the Nigerian Apartments mobile application and website.{'\n'}
            • <Text style={styles.bold}>"User"</Text> means any person who accesses or uses the Platform.{'\n'}
            • <Text style={styles.bold}>"Renter"</Text> means a User who books or intends to book an apartment.{'\n'}
            • <Text style={styles.bold}>"Host"</Text> or <Text style={styles.bold}>"Property Owner"</Text> means a User who lists apartments for rent.{'\n'}
            • <Text style={styles.bold}>"Booking"</Text> means a confirmed reservation of an apartment.{'\n'}
            • <Text style={styles.bold}>"Service"</Text> means the apartment rental platform and related services provided by Nigerian Apartments.
          </Text>
        </View>

        {/* 2. Acceptance of Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By creating an account, accessing, or using the Platform, you acknowledge that you have 
            read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do 
            not agree to these Terms, you must not use the Platform.
          </Text>
          <Text style={styles.sectionText}>
            These Terms constitute a legally binding agreement between you and Nigerian Apartments, 
            governed by Nigerian law, including but not limited to:
          </Text>
          <Text style={styles.sectionText}>
            • The Constitution of the Federal Republic of Nigeria 1999 (as amended){'\n'}
            • The Consumer Protection Act 2019{'\n'}
            • The Nigerian Data Protection Regulation (NDPR) 2019{'\n'}
            • The Cybercrimes (Prohibition, Prevention, etc.) Act 2015{'\n'}
            • Relevant state tenancy laws (Lagos State Tenancy Law, etc.)
          </Text>
        </View>

        {/* 3. Eligibility and Account Registration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Eligibility and Account Registration</Text>
          <Text style={styles.subsectionTitle}>3.1. Age Requirement</Text>
          <Text style={styles.sectionText}>
            You must be at least 18 years old to use the Platform. By using the Platform, you 
            represent and warrant that you are of legal age to enter into a binding contract 
            under Nigerian law.
          </Text>
          <Text style={styles.subsectionTitle}>3.2. Account Registration</Text>
          <Text style={styles.sectionText}>
            To use certain features, you must create an account. You agree to:
          </Text>
          <Text style={styles.sectionText}>
            • Provide accurate, current, and complete information{'\n'}
            • Maintain and update your information to keep it accurate{'\n'}
            • Maintain the security of your account credentials{'\n'}
            • Accept responsibility for all activities under your account{'\n'}
            • Notify us immediately of any unauthorized access
          </Text>
          <Text style={styles.subsectionTitle}>3.3. Account Termination</Text>
          <Text style={styles.sectionText}>
            We reserve the right to suspend or terminate your account if you violate these Terms, 
            engage in fraudulent activity, or for any other reason we deem necessary to protect 
            the Platform and other Users.
          </Text>
        </View>

        {/* 4. Use of the Platform */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Use of the Platform</Text>
          <Text style={styles.subsectionTitle}>4.1. Permitted Use</Text>
          <Text style={styles.sectionText}>
            You may use the Platform solely for lawful purposes related to apartment rental and 
            booking services. You agree not to:
          </Text>
          <Text style={styles.sectionText}>
            • Use the Platform for any illegal or unauthorized purpose{'\n'}
            • Violate any applicable Nigerian laws or regulations{'\n'}
            • Infringe upon the rights of others{'\n'}
            • Transmit any harmful code, viruses, or malware{'\n'}
            • Attempt to gain unauthorized access to the Platform{'\n'}
            • Interfere with or disrupt the Platform's operation{'\n'}
            • Use automated systems to access the Platform without permission{'\n'}
            • Impersonate any person or entity{'\n'}
            • Harass, abuse, or harm other Users
          </Text>
          <Text style={styles.subsectionTitle}>4.2. Content Standards</Text>
          <Text style={styles.sectionText}>
            All content posted on the Platform must be accurate, lawful, and not misleading. 
            Property listings must accurately represent the apartment's condition, location, 
            amenities, and availability.
          </Text>
        </View>

        {/* 5. Property Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Property Listings</Text>
          <Text style={styles.subsectionTitle}>5.1. Host Responsibilities</Text>
          <Text style={styles.sectionText}>
            As a Host, you agree to:
          </Text>
          <Text style={styles.sectionText}>
            • Provide accurate and complete information about your property{'\n'}
            • Ensure your property complies with all applicable Nigerian laws, including building 
              codes, safety regulations, and tenancy laws{'\n'}
            • Maintain your property in a safe and habitable condition{'\n'}
            • Honor confirmed bookings and provide the property as described{'\n'}
            • Respond promptly to booking inquiries and requests{'\n'}
            • Comply with all applicable tax obligations
          </Text>
          <Text style={styles.subsectionTitle}>5.2. Listing Accuracy</Text>
          <Text style={styles.sectionText}>
            Hosts are solely responsible for the accuracy of their listings. Nigerian Apartments 
            does not verify property information and is not liable for misrepresentations. 
            However, we reserve the right to remove or modify listings that violate our policies.
          </Text>
          <Text style={styles.subsectionTitle}>5.3. Property Ownership</Text>
          <Text style={styles.sectionText}>
            By listing a property, you represent and warrant that you have the legal right to 
            rent the property, either as the owner or as an authorized agent. You must have 
            obtained all necessary permissions and licenses required by Nigerian law.
          </Text>
          <Text style={styles.subsectionTitle}>5.4. Prohibited Listings</Text>
          <Text style={styles.sectionText}>
            You may not list properties that:
          </Text>
          <Text style={styles.sectionText}>
            • Violate any Nigerian laws or regulations{'\n'}
            • Are used for illegal activities{'\n'}
            • Pose safety or health hazards{'\n'}
            • Infringe upon intellectual property rights{'\n'}
            • Contain false or misleading information
          </Text>
        </View>

        {/* 6. Bookings and Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Bookings and Payments</Text>
          <Text style={styles.subsectionTitle}>6.1. Booking Process</Text>
          <Text style={styles.sectionText}>
            When you make a booking, you enter into a direct contract with the Host. Nigerian Apartments 
            acts as an intermediary platform facilitating the transaction. The booking 
            is subject to:
          </Text>
          <Text style={styles.sectionText}>
            • Property availability at the time of booking{'\n'}
            • Host acceptance of the booking request{'\n'}
            • Successful payment processing{'\n'}
            • Compliance with the property's house rules
          </Text>
          <Text style={styles.subsectionTitle}>6.2. Payment Terms</Text>
          <Text style={styles.sectionText}>
            All payments are processed through secure payment gateways in compliance with 
            Nigerian financial regulations. Payment methods include:
          </Text>
          <Text style={styles.sectionText}>
            • Bank cards (Visa, Mastercard, Verve){'\n'}
            • Bank transfers{'\n'}
            • Digital wallets{'\n'}
            • Other approved payment methods
          </Text>
          <Text style={styles.sectionText}>
            Payments are processed in Nigerian Naira (NGN). All prices are displayed in NGN 
            unless otherwise stated. You agree to pay all applicable fees, including booking 
            fees, service charges, and taxes as required by Nigerian law.
          </Text>
          <Text style={styles.subsectionTitle}>6.3. Service Fees</Text>
          <Text style={styles.sectionText}>
            Nigerian Apartments may charge service fees for facilitating bookings. These fees 
            will be clearly disclosed before you complete a booking. Service fees are 
            non-refundable except as required by law or as stated in our cancellation policy.
          </Text>
          <Text style={styles.subsectionTitle}>6.4. Refunds and Cancellations</Text>
          <Text style={styles.sectionText}>
            Cancellation and refund policies vary by property and are displayed during the 
            booking process. Refunds are processed in accordance with:
          </Text>
          <Text style={styles.sectionText}>
            • The property's cancellation policy{'\n'}
            • Nigerian consumer protection laws{'\n'}
            • Our refund policy as stated at the time of booking
          </Text>
          <Text style={styles.sectionText}>
            Under the Consumer Protection Act 2019, you have certain rights regarding 
            cancellations and refunds. If a property is not as described or unavailable, 
            you may be entitled to a full refund.
          </Text>
        </View>

        {/* 7. Renter Responsibilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Renter Responsibilities</Text>
          <Text style={styles.sectionText}>
            As a Renter, you agree to:
          </Text>
          <Text style={styles.sectionText}>
            • Provide accurate information during booking{'\n'}
            • Respect the property and follow house rules{'\n'}
            • Use the property solely for residential purposes{'\n'}
            • Not cause damage to the property{'\n'}
            • Comply with all applicable laws and regulations{'\n'}
            • Pay all fees and charges as agreed{'\n'}
            • Notify the Host immediately of any issues{'\n'}
            • Leave the property in the same condition as received (reasonable wear and tear excepted)
          </Text>
          <Text style={styles.sectionText}>
            You are responsible for any damage caused to the property beyond normal wear and tear. 
            Security deposits, if applicable, may be used to cover damages in accordance with 
            the terms agreed upon at booking.
          </Text>
        </View>

        {/* 8. Disputes and Resolution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Disputes and Resolution</Text>
          <Text style={styles.subsectionTitle}>8.1. Dispute Resolution Process</Text>
          <Text style={styles.sectionText}>
            In the event of a dispute between Users, we encourage direct communication and 
            amicable resolution. Nigerian Apartments may, at its discretion, assist in resolving 
            disputes but is not obligated to do so.
          </Text>
          <Text style={styles.subsectionTitle}>8.2. Mediation</Text>
          <Text style={styles.sectionText}>
            If a dispute cannot be resolved directly, parties agree to attempt mediation 
            through a mutually agreed mediator before pursuing legal action, in accordance 
            with Nigerian Alternative Dispute Resolution (ADR) practices.
          </Text>
          <Text style={styles.subsectionTitle}>8.3. Legal Jurisdiction</Text>
          <Text style={styles.sectionText}>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any 
            disputes arising from these Terms or your use of the Platform shall be subject 
            to the exclusive jurisdiction of the Nigerian courts, with preference given to 
            courts in Lagos State where Nigerian Apartments operates.
          </Text>
          <Text style={styles.subsectionTitle}>8.4. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            Nigerian Apartments acts as an intermediary platform and is not a party to the rental 
            agreement between Renters and Hosts. To the maximum extent permitted by Nigerian 
            law, Nigerian Apartments:
          </Text>
          <Text style={styles.sectionText}>
            • Is not liable for any disputes between Users{'\n'}
            • Is not responsible for property conditions, safety, or availability{'\n'}
            • Does not guarantee the accuracy of listings{'\n'}
            • Is not liable for indirect, incidental, or consequential damages{'\n'}
            • Limits its liability to the amount of service fees paid in the 12 months 
              preceding the claim
          </Text>
          <Text style={styles.sectionText}>
            This limitation does not affect your statutory rights under Nigerian consumer 
            protection laws.
          </Text>
        </View>

        {/* 9. Data Protection and Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Data Protection and Privacy</Text>
          <Text style={styles.sectionText}>
            Your privacy is important to us. We process your personal data in accordance 
            with the Nigerian Data Protection Regulation (NDPR) 2019. By using the Platform, 
            you consent to our collection, use, and disclosure of your information as described 
            in our Privacy Policy.
          </Text>
          <Text style={styles.subsectionTitle}>9.1. Your Rights Under NDPR</Text>
          <Text style={styles.sectionText}>
            Under the NDPR, you have the right to:
          </Text>
          <Text style={styles.sectionText}>
            • Access your personal data{'\n'}
            • Request correction of inaccurate data{'\n'}
            • Request deletion of your data{'\n'}
            • Object to processing of your data{'\n'}
            • Request data portability{'\n'}
            • Withdraw consent at any time
          </Text>
          <Text style={styles.subsectionTitle}>9.2. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement appropriate technical and organizational measures to protect your 
            personal data against unauthorized access, alteration, disclosure, or destruction, 
            in compliance with NDPR requirements.
          </Text>
        </View>

        {/* 10. Intellectual Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Intellectual Property</Text>
          <Text style={styles.sectionText}>
            The Platform, including its design, features, content, and trademarks, is owned 
            by Nigerian Apartments and protected by Nigerian intellectual property laws. You may 
            not reproduce, distribute, or create derivative works without our written permission.
          </Text>
          <Text style={styles.sectionText}>
            You retain ownership of content you post on the Platform but grant Nigerian Apartments 
            a worldwide, non-exclusive, royalty-free license to use, display, and distribute 
            your content for the purpose of operating the Platform.
          </Text>
        </View>

        {/* 11. Prohibited Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Prohibited Activities</Text>
          <Text style={styles.sectionText}>
            You agree not to engage in any of the following prohibited activities:
          </Text>
          <Text style={styles.sectionText}>
            • Fraud, deception, or misrepresentation{'\n'}
            • Money laundering or financing illegal activities{'\n'}
            • Violation of any Nigerian laws or regulations{'\n'}
            • Harassment, discrimination, or hate speech{'\n'}
            • Spam, phishing, or other malicious activities{'\n'}
            • Circumventing payment systems or fees{'\n'}
            • Creating fake accounts or listings{'\n'}
            • Interfering with the Platform's security or functionality
          </Text>
          <Text style={styles.sectionText}>
            Violation of this section may result in immediate account termination and may 
            subject you to legal action under Nigerian law, including the Cybercrimes Act 2015.
          </Text>
        </View>

        {/* 12. Modifications to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Modifications to Terms</Text>
          <Text style={styles.sectionText}>
            We reserve the right to modify these Terms at any time. Material changes will be 
            notified through the Platform or via email. Your continued use of the Platform 
            after such modifications constitutes acceptance of the updated Terms.
          </Text>
          <Text style={styles.sectionText}>
            If you do not agree to the modified Terms, you must stop using the Platform and 
            may request deletion of your account.
          </Text>
        </View>

        {/* 13. Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Termination</Text>
          <Text style={styles.subsectionTitle}>13.1. Termination by You</Text>
          <Text style={styles.sectionText}>
            You may terminate your account at any time by contacting us or using the account 
            deletion feature in the app. Upon termination, your right to use the Platform 
            immediately ceases.
          </Text>
          <Text style={styles.subsectionTitle}>13.2. Termination by Us</Text>
          <Text style={styles.sectionText}>
            We may suspend or terminate your account immediately if you violate these Terms, 
            engage in fraudulent activity, or for any other reason we deem necessary to 
            protect the Platform and other Users.
          </Text>
          <Text style={styles.subsectionTitle}>13.3. Effect of Termination</Text>
          <Text style={styles.sectionText}>
            Upon termination, all outstanding bookings remain valid, and you remain responsible 
            for any obligations arising from existing bookings. We may delete your account data 
            in accordance with our Privacy Policy and NDPR requirements.
          </Text>
        </View>

        {/* 14. Force Majeure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Force Majeure</Text>
          <Text style={styles.sectionText}>
            Nigerian Apartments shall not be liable for any failure or delay in performance due 
            to circumstances beyond our reasonable control, including but not limited to natural 
            disasters, war, terrorism, pandemics, government actions, internet failures, or 
            other force majeure events as recognized under Nigerian law.
          </Text>
        </View>

        {/* 15. Severability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Severability</Text>
          <Text style={styles.sectionText}>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable 
            under Nigerian law, the remaining provisions shall remain in full force and effect. 
            The invalid provision shall be replaced with a valid provision that most closely 
            reflects the intent of the original provision.
          </Text>
        </View>

        {/* 16. Entire Agreement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Entire Agreement</Text>
          <Text style={styles.sectionText}>
            These Terms, together with our Privacy Policy, constitute the entire agreement 
            between you and Nigerian Apartments regarding your use of the Platform and supersede 
            all prior agreements and understandings.
          </Text>
        </View>

        {/* 17. Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms, please contact us:
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Email:</Text> support@nigerianapartments.com{'\n'}
            <Text style={styles.bold}>Phone/WhatsApp:</Text> +234 703 658 8568{'\n'}
            <Text style={styles.bold}>Website:</Text> nigerianapartments.com{'\n'}
            <Text style={styles.bold}>Location:</Text> Lagos, Nigeria
          </Text>
        </View>

        {/* Acknowledgment */}
        <View style={styles.acknowledgmentSection}>
          <Text style={styles.acknowledgmentText}>
            By using Nigerian Apartments, you acknowledge that you have read, understood, and 
            agree to be bound by these Terms and Conditions, which are governed by the laws 
            of the Federal Republic of Nigeria.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Nigerian Apartments. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  introText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  acknowledgmentSection: {
    padding: 20,
    backgroundColor: '#FFF9E6',
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  acknowledgmentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
