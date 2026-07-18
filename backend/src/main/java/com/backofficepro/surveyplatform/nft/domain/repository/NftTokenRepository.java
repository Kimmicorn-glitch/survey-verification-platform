package com.backofficepro.surveyplatform.nft.domain.repository;

import com.backofficepro.surveyplatform.nft.domain.NftToken;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for the NftToken aggregate.
 *
 * @author BackOffice Pro
 */
public interface NftTokenRepository {

    Optional<NftToken> findById(UUID id);

    Optional<NftToken> findByTokenId(String tokenId);

    List<NftToken> findByOwnerAddress(String ownerAddress);

    Page<NftToken> findByOwnerAddress(String ownerAddress, Pageable pageable);

    Page<NftToken> findBySurveyId(String surveyId, Pageable pageable);

    Optional<NftToken> findByVerificationId(String verificationId);

    Page<NftToken> findByRespondentId(String respondentId, Pageable pageable);

    long countByRespondentId(String respondentId);

    long countByRespondentIdAndMintedTrue(String respondentId);

    List<NftToken> findByCreatorAddress(String creatorAddress);

    NftToken save(NftToken token);

    void deleteById(UUID id);

    boolean existsBySurveyIdAndVerificationId(String surveyId, String verificationId);
}
