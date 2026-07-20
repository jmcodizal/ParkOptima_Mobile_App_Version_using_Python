import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  Image,
  Keyboard,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import TopBar from '@/components/ui/top-bar';
import { apiRequest, getApiBaseUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { IconSymbol } from '@/components/ui/icon-symbol';

// ML Kit OCR import with fallback
let MLKit: any = null;
try {
  MLKit = require('react-native-mlkit-ocr').default;
} catch {
  console.warn('react-native-mlkit-ocr not available – OCR will be simulated');
}

// Helper: Extract plate number from OCR text
const extractPlateFromText = (text: string): string | null => {
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const anyMatch = cleaned.match(/([A-Z0-9]{3,})/);
  return anyMatch ? anyMatch[1] : null;
};

// Helper: Format plate number
const formatPlateNumber = (text: string): string => {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);
};

const COLORS = {
  navy: '#1D3D8A',
  navyDark: '#0D1B2A',
  teal: '#13B4AA',
  tealLight: '#3CC9B8',
  white: '#FFFFFF',
  surface: '#F5F6F8',
  border: '#D4D6D8',
  inputBorder: '#D4D6D8',
  textPrimary: '#2C2C33',
  textSecondary: '#6A707F',
  textMuted: '#6A707F',
  cardBg: '#FFFFFF',
  scanFrame: '#13B4AA',
  motorBg: '#F5F6F8',
  motorIcon: '#F39C12',
  wheelsBg: '#F5F6F8',
  wheelsIcon: '#1F4DA0',
};

type TabMode = 'Camera Scan' | 'Manual Exit';
type VehicleType = 'Motor' | '4 Wheels';

export default function ScanExitScreen() {
  const [activeTab, setActiveTab] = useState<TabMode>('Camera Scan');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('Motor');
  const [alignToggle, setAlignToggle] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const cameraRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const inputPositions = useRef<Record<string, number>>({});
  const { userId } = useAuth();

  const handleSubmitExit = async () => {
    if (!plateNumber.trim()) {
      Alert.alert('Validation error', 'Please enter a plate number.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<any>('/api/scan-out', {
        method: 'POST',
        body: JSON.stringify({
          plate: plateNumber.trim(),
          attendant_id: userId,
          vehicle_type: selectedVehicle === 'Motor' ? '2wheels' : '4wheels',
          brand: brandModel,
          color: vehicleColor,
        }),
      });
      setMessage(response.message || 'Parking session completed');
      setPlateNumber('');
      setBrandModel('');
      setVehicleColor('');
    } catch (error) {
      Alert.alert('Exit failed', error instanceof Error ? error.message : 'Unable to start parking session.');
    } finally {
      setLoading(false);
    }
  };

  const scrollInputIntoView = (field: 'plate' | 'brand' | 'color') => {
    const container = scrollViewRef.current;
    if (!container) {
      return;
    }

    const offsetY = Math.max(0, (inputPositions.current[field] || 0) - 90);
    container.scrollTo({ y: offsetY, animated: true });
  };

  const handleInputLayout = (field: 'plate' | 'brand' | 'color', event: any) => {
    inputPositions.current[field] = event.nativeEvent.layout.y;
  };

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await Camera.getCameraPermissionsAsync();
      setPermissionStatus(permission.status);
      if (permission.status !== 'granted') {
        setIsCameraVisible(false);
      }
      setCameraReady(false);
    };

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        if (activeTab === 'Manual Exit') {
          scrollInputIntoView('plate');
        }
      }, 120);
    });

    checkPermission();
    return () => {
      keyboardDidShowListener.remove();
    };
  }, [activeTab]);

  const handleOpenCamera = async () => {
    const permission = await Camera.getCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      const result = await Camera.requestCameraPermissionsAsync();
      setPermissionStatus(result.status);
      if (result.status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is required to scan a license plate.');
        return;
      }
    }

    setIsCameraVisible(true);
    setCameraReady(false);
    setMessage('Live camera ready. Tap capture to scan.');
  };

  const handleCaptureAndRecognize = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready. Please try again.');
      return;
    }

    setIsScanning(true);
    setLoading(true);
    try {
      // Take a picture
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
        quality: 0.8,
      });

      if (!photo?.uri) {
        Alert.alert('Error', 'Failed to capture image.');
        return;
      }

      setCapturedImage(photo.uri);

      if (MLKit) {
        // Run OCR on the captured image using Google ML Kit
        const blocks = await MLKit.detectFromUri(photo.uri);

        // Combine all recognized text from blocks
        const recognizedText = blocks.map((b: any) => b.text).join(' ').trim();
        setOcrResult(recognizedText || '(no text detected)');
        setMessage(`OCR Result: ${recognizedText}`);

        // Try to extract plate number from OCR text
        const plate = extractPlateFromText(recognizedText);
        if (plate) {
          setPlateNumber(plate);
          setMessage(`Recognized plate: ${plate}`);
        } else if (recognizedText) {
          const formatted = formatPlateNumber(recognizedText.replace(/\s/g, ''));
          setPlateNumber(formatted);
          setMessage(`Formatted plate: ${formatted}`);
        } else {
          setMessage('No text detected. Please try again or enter manually.');
        }
      } else {
        // ML Kit not available – show the image and let user type plate manually
        setOcrResult('(ML Kit not available in Expo Go – using backend fallback)');
        setMessage('Falling back to backend vision API...');
        
        // Try backend fallback
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: photo.uri,
            name: 'plate.jpg',
            type: 'image/jpeg',
          } as any);

          const apiBase = getApiBaseUrl();
          const response = await fetch(`${apiBase}/api/vision/detect`, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const data = await response.json();
          if (data?.plate) {
            setPlateNumber(data.plate);
            setMessage(`Recognized plate: ${data.plate}`);
          } else {
            setMessage('No plate detected. Please enter manually.');
          }
        } catch (error) {
          setMessage('Backend not available. Please enter plate manually.');
        }
      }
    } catch (error: any) {
      console.warn('OCR Error:', error);
      Alert.alert('Scan Error', 'Failed to recognize plate. Please try again or enter manually.');
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TopBar />

      <View style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode="interactive"
          >
          <View style={styles.pageHeader}>
            <View style={styles.headerTextWrap}>
              <ThemedText type="subtitle" style={styles.pageTitle}>
                Scan Exit
              </ThemedText>
              <ThemedText style={styles.pageSubtitle}>
                Scan or enter a license plate to log vehicle exit
              </ThemedText>
            </View>
          </View>
          {message ? (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackText}>{message}</Text>
            </View>
          ) : null}

          <View style={styles.tabRow}>
            {(['Camera Scan', 'Manual Exit'] as TabMode[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.vehicleRow}>
            <TouchableOpacity
              style={[styles.vehicleCard, selectedVehicle === 'Motor' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('Motor')}
              activeOpacity={0.85}
            >
              <View style={[styles.vehicleIconWrap, { backgroundColor: COLORS.motorBg }]}> 
                <View style={styles.motorIcon}>
                  <View style={styles.motorBody} />
                  <View style={styles.motorWheel} />
                  <View style={[styles.motorWheel, { marginLeft: 6 }]} />
                </View>
              </View>
              <Text style={styles.vehicleLabel}>Motor</Text>
              <Text style={styles.vehiclePrice}>₱5.00 FLAT RATE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vehicleCard, selectedVehicle === '4 Wheels' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('4 Wheels')}
              activeOpacity={0.85}
            >
              <View style={[styles.vehicleIconWrap, { backgroundColor: COLORS.wheelsBg }]}> 
                <View style={styles.carIcon}>
                  <View style={styles.carRoof} />
                  <View style={styles.carBody} />
                  <View style={styles.carWheelsRow}>
                    <View style={styles.carWheel} />
                    <View style={styles.carWheel} />
                  </View>
                </View>
              </View>
              <Text style={styles.vehicleLabel}>4 Wheels</Text>
              <Text style={styles.vehiclePrice}>₱20.00 FLAT RATE</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Camera Scan' ? (
            <>
              <View style={styles.viewfinder}>
                {isCameraVisible && permissionStatus === 'granted' ? (
                  <>
                    <CameraView
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      facing="back"
                      onCameraReady={() => setCameraReady(true)}
                    />
                    <View style={styles.scannerOverlay}>
                      <View style={styles.cornerTL} />
                      <View style={styles.cornerTR} />
                      <View style={styles.cornerBL} />
                      <View style={styles.cornerBR} />
                      <Text style={styles.cameraReadyText}>{cameraReady ? 'SCANNING LIVE' : 'STARTING CAMERA...'}</Text>
                    </View>
                  </>
                ) : capturedImage ? (
                  <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                ) : (
                  <>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                    <Text style={styles.cameraReadyText}>CAMERA READY</Text>
                  </>
                )}
              </View>

              <View style={styles.alignRow}>
                <Switch
                  value={alignToggle}
                  onValueChange={setAlignToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.teal }}
                  thumbColor={COLORS.white}
                  style={styles.switch}
                />
                <Text style={styles.alignLabel}>Align license plate within the frame</Text>
              </View>

              <TouchableOpacity
                style={[styles.activateBtn, loading && styles.btnDisabled]}
                activeOpacity={0.85}
                onPress={isCameraVisible ? handleCaptureAndRecognize : handleOpenCamera}
                disabled={loading}
              >
                <Text style={styles.activateBtnIcon}>📷</Text>
                <Text style={styles.activateBtnText}>{loading ? 'Recognizing...' : isCameraVisible ? 'Capture & Scan' : 'Activate Camera'}</Text>
              </TouchableOpacity>

              <View style={styles.manualCard}>
                <Text style={styles.fieldLabel}>PLATE NUMBER</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                    placeholder="Recognized plate will appear here"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                    onFocus={() => scrollInputIntoView('plate')}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.btnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleSubmitExit}
                  disabled={loading || !plateNumber.trim()}
                >
                  <Text style={styles.submitText}>{loading ? 'Saving...' : 'Record Exit'}</Text>
                </TouchableOpacity>
              </View>
            </>
            ) : (
            <View style={styles.manualCard}>
              <Text style={styles.fieldLabel}>PLATE NUMBER</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIconWrap}>
                  <View style={styles.idIcon}>
                    <View style={styles.idStripe} />
                    <View style={styles.idDot} />
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                  placeholder="Enter plate number"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                  onFocus={() => scrollInputIntoView('plate')}
                />
              </View>

              <Text style={styles.fieldLabel}>VEHICLE DETAILS</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIconWrap}>
                  <View style={styles.idIcon}>
                    <View style={styles.idStripe} />
                    <View style={styles.idDot} />
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  value={brandModel}
                  onChangeText={setBrandModel}
                  placeholder="Enter brand model"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                  onFocus={() => scrollInputIntoView('brand')}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputIconWrap}>
                  <View style={styles.idIcon}>
                    <View style={styles.idStripe} />
                    <View style={styles.idDot} />
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  placeholder="Enter vehicle color"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                  onFocus={() => scrollInputIntoView('color')}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                activeOpacity={0.85}
                onPress={handleSubmitExit}
                disabled={loading}
              >
                <Text style={styles.submitText}>{loading ? 'Saving...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        {/* Camera is available from the central tab button; remove per-screen FAB */}
      </KeyboardAvoidingView>
    </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 180,
  },
  pageHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  feedbackBanner: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F8EE',
  },
  feedbackText: {
    color: '#0F766E',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: COLORS.navy,
  },
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  vehicleCard: {
    flex: 1,
    flexBasis: '48%',
    minWidth: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  vehicleCardActive: {
    borderColor: COLORS.teal,
    shadowColor: '#E8EAF0',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  vehicleIconWrap: {
    width: 56,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  motorIcon: {
    alignItems: 'center',
  },
  motorBody: {
    width: 28,
    height: 10,
    backgroundColor: COLORS.motorIcon,
    borderRadius: 4,
    marginBottom: 3,
  },
  motorWheel: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.navy,
    position: 'absolute',
    bottom: 0,
  },
  carIcon: {
    alignItems: 'center',
  },
  carRoof: {
    width: 18,
    height: 7,
    backgroundColor: COLORS.wheelsIcon,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  carBody: {
    width: 28,
    height: 8,
    backgroundColor: COLORS.wheelsIcon,
    borderRadius: 2,
  },
  carWheelsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 1,
  },
  carWheel: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.navy,
  },
  vehicleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vehiclePrice: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  viewfinder: {
    height: 170,
    backgroundColor: COLORS.navyDark,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cameraReadyText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  alignRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  alignLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cameraCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cameraCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cameraCardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  activateBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  activateBtnIcon: {
    fontSize: 16,
  },
  activateBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyIconWrap: {
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyCarRoof: {
    width: 30,
    height: 12,
    backgroundColor: COLORS.border,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  emptyCarBody: {
    width: 46,
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  emptyCarWheels: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  emptyCarWheel: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textMuted,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIconWrap: { marginRight: 8 },
  idIcon: {
    width: 18,
    height: 13,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 3,
    gap: 2,
  },
  idStripe: { width: 10, height: 2, backgroundColor: COLORS.white, borderRadius: 1 },
  idDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.white },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  manualCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
    marginBottom: 24,
  },
  manualExitWrap: {
    paddingBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
