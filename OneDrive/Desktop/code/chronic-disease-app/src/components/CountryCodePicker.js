import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Text, TextInput, Button, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COUNTRY_CODES, DEFAULT_COUNTRY } from '../utils/countryCodes';

const CountryCodePicker = ({ 
  selectedCountry = DEFAULT_COUNTRY, 
  onCountrySelect, 
  style,
  disabled = false 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤国家列表
  const filteredCountries = COUNTRY_CODES.filter(country => 
    country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery)
  );

  const handleCountrySelect = (country) => {
    onCountrySelect(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryDetails}>
        <View style={styles.countryMainInfo}>
          <Text style={styles.countryName}>{item.country}</Text>
          <Text style={styles.countryCode}>{item.code}</Text>
        </View>
        <Text style={styles.countryExample}>
          {item.example ? `如: ${item.example}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity 
        style={[styles.picker, style, disabled && styles.pickerDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
        <Text style={styles.selectedCountryCode}>{selectedCountry.code}</Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? '#ccc' : '#666'} 
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft} />
              <Text style={styles.modalTitle}>选择国家/地区</Text>
              <View style={styles.headerRight}>
                <Button 
                  mode="text" 
                  onPress={() => setModalVisible(false)}
                  labelStyle={styles.closeButton}
                  compact
                >
                  关闭
                </Button>
              </View>
            </View>
          </View>
          
          <Searchbar
            placeholder="搜索国家或区号"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />
          
          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item, index) => `${item.code}-${index}`}
            style={styles.countryList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 120,
    maxWidth: 140,
  },
  pickerDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  countryFlag: {
    fontSize: 22,
    marginRight: 8,
    width: 28,
    textAlign: 'center',
  },
  selectedCountryCode: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontWeight: '500',
    textAlign: 'left',
    marginLeft: 2,
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 60,
  },
  headerLeft: {
    width: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    marginHorizontal: 16,
    marginVertical: 16,
    elevation: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    fontSize: 16,
    paddingLeft: 16,
  },
  countryList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  countryDetails: {
    flex: 1,
    marginLeft: 12,
  },
  countryMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  countryCode: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  countryExample: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});

export default CountryCodePicker; 