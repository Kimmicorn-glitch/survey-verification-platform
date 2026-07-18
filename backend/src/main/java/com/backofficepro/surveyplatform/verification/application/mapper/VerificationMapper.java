package com.backofficepro.surveyplatform.verification.application.mapper;

import com.backofficepro.surveyplatform.verification.application.dto.response.VerificationResponse;
import com.backofficepro.surveyplatform.verification.domain.VerificationRequest;
import org.mapstruct.Mapper;

/**
 * MapStruct mapper for Verification domain entities and DTOs.
 *
 * @author BackOffice Pro
 */
@Mapper(componentModel = "spring")
public interface VerificationMapper {

    /**
     * Maps a VerificationRequest entity to a VerificationResponse DTO.
     *
     * @param request the VerificationRequest entity
     * @return the VerificationResponse DTO
     */
    VerificationResponse toResponse(VerificationRequest request);
}
