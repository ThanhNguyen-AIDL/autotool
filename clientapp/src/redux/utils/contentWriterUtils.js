import { useDispatch, useSelector } from "react-redux";
import {setPromtWriter,  setContentWriter} from "../ducks/contentWriterDucks";

export const useWriterText = () => {
    const dispatch = useDispatch();
  
    const { writerResponse, promtInput } = useSelector(state => state.writer);
    const setWriterResponse = async (text ) => {
        dispatch(setContentWriter(text));
        // await dispatch(fetchTokenDetail(pumpId)); // Initial fetch
    }
    const setWriterPromt = async (text ) => {
        dispatch(setPromtWriter(text));
        // await dispatch(fetchTokenDetail(pumpId)); // Initial fetch
    }

    return {
      writerResponse,
      setWriterResponse,
      promtInput, 
      setWriterPromt
    };
};