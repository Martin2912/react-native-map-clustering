import React, { memo, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Marker, Callout } from "react-native-maps";
import { returnMarkerStyle } from "./helpers";


const ClusteredMarker = ({
  geometry,
  properties,
  onPress,
  clusterColor,
  clusterTextColor,
  clusterFontFamily,
  tracksViewChanges,
}) => {
  const points = properties.point_count;
  const { width, height, fontSize, size } = returnMarkerStyle(points);
  
  return (
    <Marker
      key={`${geometry.coordinates[0]}_${geometry.coordinates[1]}`}
      coordinate={{
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
      }}
      anchor={{x: 0.5, y: 0.5}}
      style={{ zIndex: points + 1 }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
    >
      <TouchableOpacity
        activeOpacity={0.5}
        style={[styles.container, { width, height }]}
      >
        <View
          style={[
            styles.wrapper,
            {
              backgroundColor: clusterColor,
              width: size + 5,
              height: size + 5,
              borderRadius: width / 2,
            },
          ]}
        />
        <View
          style={[
            styles.cluster,
            {
              backgroundColor: clusterColor,
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              {
                color: clusterTextColor,
                fontSize,
                fontFamily: clusterFontFamily,
              },
            ]}
          >
            {points}
          </Text>
        </View>
      </TouchableOpacity>
      <Callout tooltip >
        <View>
          <View style={{
            flexDirection: 'column',
            alignSelf: 'flex-start',
            backgroundColor: clusterColor,
            borderRadius: 6,
            borderColor: '#ffffff',
            borderWidth: 0,
            padding: 15,
            width: 150,
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowOpacity: 0.27,
            shadowRadius: 4.65,
            elevation: 6,
}}>
            <Text style={styles.name}>
              {clusterColor==='#e36387'? 'Alerte !' : 'Bonne nouvelle !'}
            </Text>
            <Text style={styles.contenu}>
              {points} {clusterColor==='#e36387'? "personnes ont signalé une coupure d'eau dans ce quartier." : "personnes ont confirmé le rétablissement de l'eau dans ce quartier."}
            </Text>
          </View>
          <View style={{
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: clusterColor,
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -1,
  }}/>
          <View style={{
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: clusterColor,
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -32,
  }}/>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  wrapper: {
    position: "absolute",
    opacity: 0.5,
    zIndex: 0,
  },
  cluster: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  text: {
    fontWeight: "bold",
  },
  bubble: {
    flexDirection: 'column',
    alignSelf: 'flex-start',

    borderRadius: 6,
    borderColor: '#ffffff',
    borderWidth: 0.5,
    padding: 15,
    width: 150,
    alignItems: 'center',

  },
  name: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
    fontFamily: 'Montserrat',
    alignItems: 'center',
    fontWeight: "bold",
  },
  contenu: {
    fontSize: 13,
    color: 'white',
    marginBottom: 2,
    fontFamily: 'Montserrat',
  },
  
});

export default memo(ClusteredMarker);
