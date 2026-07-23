import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordRequirementsListProps {
  password: string;
}

export default function PasswordRequirementsList({ password }: PasswordRequirementsListProps) {
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const requirements = [
    { label: 'At least 6 characters', met: hasMinLength },
    { label: 'At least 1 number', met: hasNumber },
    { label: 'At least 1 special character (!@#$%^&* etc)', met: hasSpecialChar },
  ];

  return (
    <View style={styles.container}>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirementRow}>
          <View
            style={[
              styles.checkmark,
              { backgroundColor: req.met ? '#22c55e' : '#f5f5f5' },
            ]}
          >
            {req.met && <Ionicons name="checkmark" size={14} color="#fff" />}
            {!req.met && <Text style={styles.xMark}>✕</Text>}
          </View>
          <Text
            style={[
              styles.requirementText,
              { color: req.met ? '#22c55e' : '#dc2626' },
            ]}
          >
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  xMark: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
