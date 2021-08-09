package db

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"testing"
)

func TestNewGoLevelDB(t *testing.T) {
	tmpFile, _ := ioutil.TempDir("", "testdb")
	defer os.Remove(tmpFile)

	db, err := NewGoLevelDB(tmpFile)
	if err != nil {
		t.Fatal(err)
	}
	testKey := []byte("test_key")
	testValue := []byte("test_value")

	db.Set(testKey, testValue)
	returnedValue := db.Get(testKey)
	if !bytes.Equal(returnedValue, testValue) {
		t.Fatal("values are not equal")
	}

}

func BenchmarkRandomReadsWrites(b *testing.B) {
	b.StopTimer()

	numItems := int64(1000000)
	internal := map[int64]int64{}
	for i := 0; i < int(numItems); i++ {
		internal[int64(i)] = int64(0)
	}
	tmpFile, _ := ioutil.TempDir("", "testdb")
	defer os.Remove(tmpFile)

	db, err := NewGoLevelDB(tmpFile)
	if err != nil {
		b.Fatal(err.Error())
		return
	}

	fmt.Println("ok, starting benchmark")
	b.StartTimer()

	for i := 0; i < b.N; i++ {
		// Write something
		{
			idx := (int64(rand.Int()) % numItems)
			internal[idx]++
			val := internal[idx]
			idxBytes := int642Bytes(int64(idx))
			valBytes := int642Bytes(int64(val))
			//fmt.Printf("Set %X -> %X\n", idxBytes, valBytes)
			db.Set(
				idxBytes,
				valBytes,
			)
		}
		// Read something
		{
			idx := (int64(rand.Int()) % numItems)
			val := internal[idx]
			idxBytes := int642Bytes(int64(idx))
			valBytes := db.Get(idxBytes)
			//fmt.Printf("Get %X -> %X\n", idxBytes, valBytes)
			if val == 0 {
				if !bytes.Equal(valBytes, nil) {
					b.Errorf("Expected %v for %v, got %X",
						nil, idx, valBytes)
					break
				}
			} else {
				if len(valBytes) != 8 {
					b.Errorf("Expected length 8 for %v, got %X",
						idx, valBytes)
					break
				}
				valGot := bytes2Int64(valBytes)
				if val != valGot {
					b.Errorf("Expected %v for %v, got %v",
						val, idx, valGot)
					break
				}
			}
		}
	}

	db.Close()
}

func int642Bytes(i int64) []byte {
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(i))
	return buf
}

func bytes2Int64(buf []byte) int64 {
	return int64(binary.BigEndian.Uint64(buf))
}
