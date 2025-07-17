import { useDispatch, useSelector } from "react-redux";
import {setFileLogs, setLogRecords, setSelectdFileLog} from "../ducks/logDucks";

export const useLogManager = () => {
    const dispatch = useDispatch();
  
    const { logFiles, logEntities, selectedFile } = useSelector(state => state.logs);
    const setLogNames = async (list ) => {
        dispatch(setFileLogs(list));
        // await dispatch(fetchTokenDetail(pumpId)); // Initial fetch
    }
    const setLogRows = async (list ) => {
        dispatch(setLogRecords(list));
        // await dispatch(fetchTokenDetail(pumpId)); // Initial fetch
    }

    const setSelectedName = async (name ) => {
        dispatch(setSelectdFileLog(name));
        // await dispatch(fetchTokenDetail(pumpId)); // Initial fetch
    }


    return {
      setLogNames,
      setLogRows,
      setSelectedName,
      logFiles, 
      logEntities,
      selectedFile
    };
};